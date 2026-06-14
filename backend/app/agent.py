"""
The agent loop. Stateless: every function loads what it needs, acts, persists.
The LLM phrases and judges; deterministic code owns selection and the mastery
update.

Policy is data, not code: each Enrollment carries toggles (selection strategy,
repeat cooldown, marking strictness, question style). Strategies live in the
SELECTION_STRATEGIES registry - adding one = one function + one entry here,
plus its name in schemas.SelectionStrategy so the API accepts it.
"""
import math
import random
from datetime import datetime, timedelta
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from . import llm
from .models import (
    utcnow, User, Enrollment, Skill, SkillState, Attempt, AttemptMessage, Question,
)
from .retrieval import ContextRetriever, maybe_update_profile, maybe_update_skill_note


# --- deterministic mastery update (NOT the LLM's job) ----------------------

VERDICT_TARGET = {"correct": 1.0, "partial": 0.5, "wrong": 0.0}


def update_skill_state(st: SkillState, verdict: str) -> None:
    """EMA toward the outcome + spaced-repetition interval. Tune freely."""
    target = VERDICT_TARGET.get(verdict, 0.0)
    st.score += 0.3 * (target - st.score)
    st.attempts += 1
    if verdict == "correct":
        st.correct += 1
        st.interval_hours = st.interval_hours * 2
    elif verdict == "partial":
        st.interval_hours = max(6.0, st.interval_hours)
    else:
        st.interval_hours = max(6.0, st.interval_hours / 2)
    st.last_seen_at = utcnow()
    st.due_at = st.last_seen_at + timedelta(hours=st.interval_hours)


# --- selection: score every skill, then sample (interleave + explore) -------
# The next question is chosen by a weighted PRIORITY per skill, then a softmax
# sample from the top few - NOT a greedy argmin. This kills the "tunnel on the
# weakest skill" failure and gives natural variety. The weights are knobs; the
# enrollment's selection_strategy nudges them.
#
# candidate = (Skill, SkillState, Enrollment)

W_BASE = {"overdue": 1.0, "weakness": 1.0, "novelty": 0.6, "exam": 0.8, "fatigue": 1.5}

# strategy name -> weight overrides. The KEYS still power the /policies endpoint
# (main.py lists them) and the schemas.SelectionStrategy enum.
SELECTION_STRATEGIES = {
    "due_then_weakest": {},                                  # defaults (weakness-leaning)
    "due_then_unseen": {"novelty": 1.2},                     # favour coverage
    "round_robin": {"novelty": 1.0, "weakness": 0.5},        # even rotation
}

TOP_K = 4             # softmax-sample among the strongest few
TEMPERATURE = 0.7     # spread: lower = focused, higher = adventurous (the "mix it up" dial)
NOVELTY_FULL_DAYS = 14.0


def _hours_since(ts: datetime | None, now: datetime) -> float | None:
    return (now - ts).total_seconds() / 3600.0 if ts else None


def _weights(enr: Enrollment) -> dict:
    w = dict(W_BASE)
    w.update(SELECTION_STRATEGIES.get(getattr(enr, "selection_strategy", "") or "", {}))
    return w


def _exam_urgency(enr: Enrollment, now: datetime) -> float:
    """0 normally; ramps toward 1 as a course's exam approaches (within ~60 days).
    Only matters when interleaving across courses - it pulls focus when it counts."""
    exam = getattr(enr, "exam_date", None)
    if not exam:
        return 0.0
    days = (exam - now).total_seconds() / 86400.0
    if days <= 0:
        return 1.0
    return max(0.0, 1.0 - days / 60.0)


def _priority(skill: Skill, st: SkillState, enr: Enrollment, now: datetime, w: dict) -> float:
    if st.due_at is None:                       # never scheduled -> treat as due now
        overdue = 1.0
    elif st.due_at > now:                       # not due yet
        overdue = 0.0
    else:
        overdue = min((now - st.due_at).total_seconds() / 3600.0 / (st.interval_hours or 12.0), 2.0)
    weakness = 1.0 - (st.score or 0.0)
    h = _hours_since(st.last_seen_at, now)
    novelty = 1.0 if (st.attempts == 0 or h is None) else min((h / 24.0) / NOVELTY_FULL_DAYS, 1.0)
    fatigue = 0.0 if h is None else max(0.0, 1.0 - h / (enr.repeat_cooldown_hours or 6.0))
    return (w["overdue"] * overdue + w["weakness"] * weakness + w["novelty"] * novelty
            + w["exam"] * _exam_urgency(enr, now) - w["fatigue"] * fatigue)


def _sample_top_k(scored: list[tuple[float, tuple]]) -> tuple:
    """scored = [(priority, candidate)]. Softmax-sample among the top K so the
    strongest is most likely but not guaranteed -> variety, and no brittleness
    where one mis-tuned weight starves a whole topic forever."""
    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:TOP_K]
    if len(top) == 1:
        return top[0][1]
    mx = top[0][0]
    ws = [math.exp((sc - mx) / max(TEMPERATURE, 1e-6)) for sc, _ in top]
    r = random.random() * sum(ws)
    acc = 0.0
    for (sc, cand), wt in zip(top, ws):
        acc += wt
        if r <= acc:
            return cand
    return top[-1][1]


def _eligible(db: Session, enrollments: list[Enrollment], now: datetime, *,
              respect_cooldown: bool, exclude_skill_ids: set, exclude_unit_ids: set,
              effort: str | None) -> list[tuple]:
    """The GUARDRAILS: drop anything off-limits this turn, return what's left.
    no-repeat (exclude_skill_ids) + skip-leaves-the-topic (exclude_unit_ids) +
    (when strict) a just-seen, not-yet-due skill is held back."""
    out = []
    for enr in enrollments:
        ensure_skill_states(db, enr)
        q = (select(Skill, SkillState)
             .join(SkillState, SkillState.skill_id == Skill.id)
             .where(SkillState.enrollment_id == enr.id))
        if effort:
            q = q.where(Skill.effort == effort)
        for skill, st in db.execute(q).all():
            if skill.id in exclude_skill_ids:
                continue
            if skill.unit_id and skill.unit_id in exclude_unit_ids:
                continue
            if respect_cooldown:
                is_due = bool(st.due_at and st.due_at <= now)
                h = _hours_since(st.last_seen_at, now)
                if h is not None and h < (enr.repeat_cooldown_hours or 6.0) and not is_due:
                    continue
            out.append((skill, st, enr))
    return out


# --- skill selection -----------------------------------------------------------

def ensure_skill_states(db: Session, enrollment: Enrollment) -> None:
    """Lazily create SkillState rows for any program skill the enrollment is
    missing - this is how newly authored skills reach existing learners."""
    have = {
        sid for (sid,) in db.execute(
            select(SkillState.skill_id).where(SkillState.enrollment_id == enrollment.id)
        )
    }
    missing = db.execute(
        select(Skill.id).where(
            Skill.program_id == enrollment.program_id, Skill.id.not_in(have))
    ).scalars().all()
    for sid in missing:
        db.add(SkillState(enrollment_id=enrollment.id, skill_id=sid))
    if missing:
        db.flush()


def pick_skill(db: Session, enrollments: list[Enrollment], effort: str | None = None,
               respect_cooldown: bool = True, exclude_skill_ids=None,
               exclude_unit_ids=None) -> tuple[Skill, SkillState, Enrollment] | None:
    """Score every eligible skill, then softmax-sample from the top few.

    Guardrails first (see _eligible): no immediate repeat, skip leaves the topic,
    and - when respect_cooldown - a just-seen, not-due skill is held back. The
    scheduler asks strictly (returns None -> no nudge); the on-demand path relaxes
    the cooldown, then the excludes, so an explicit ask always gets a question."""
    now = utcnow()
    excl_s = set(exclude_skill_ids or [])
    excl_u = set(exclude_unit_ids or [])
    cands = _eligible(db, enrollments, now, respect_cooldown=respect_cooldown,
                      exclude_skill_ids=excl_s, exclude_unit_ids=excl_u, effort=effort)
    if not cands and respect_cooldown:
        return None                                       # scheduler-strict: no nudge
    if not cands:                                          # on-demand: relax the cooldown
        cands = _eligible(db, enrollments, now, respect_cooldown=False,
                          exclude_skill_ids=excl_s, exclude_unit_ids=excl_u, effort=effort)
    if not cands:                                          # last resort: drop the excludes too
        cands = _eligible(db, enrollments, now, respect_cooldown=False,
                          exclude_skill_ids=set(), exclude_unit_ids=set(), effort=effort)
    if not cands:
        return None
    scored = [(_priority(s, st, enr, now, _weights(enr)), (s, st, enr))
              for (s, st, enr) in cands]
    return _sample_top_k(scored)


# --- the two LLM-backed actions ----------------------------------------------

STYLE_RULES = {
    "plain": "Write in plain text/unicode only - NO LaTeX, no markdown, no \\( \\) "
             "delimiters. Use notation a phone keyboard could produce (x^2, sqrt(x), d/dx).",
    "latex": "LaTeX notation is allowed.",
}

MARKING_RUBRICS = {
    "strict": "partial ONLY for a single minor slip with a fully correct method; "
              "any method error or multiple slips = wrong.",
    "balanced": "correct method with small slips (sign, constant, one dropped term) "
                "= partial; method errors or major gaps = wrong.",
    "lenient": "credit understanding generously: right idea = partial even with "
               "several slips; only fundamentally wrong approaches = wrong.",
}


def generate_question(db: Session, user: User, skill: Skill,
                      enrollment: Enrollment | None = None) -> str:
    ctx = ContextRetriever(db).build(user, skill)
    style = STYLE_RULES.get(
        enrollment.question_style if enrollment else "plain", STYLE_RULES["plain"])
    prompt = f"""Set ONE {skill.question_type} question on "{skill.name}".
{ctx.shared}
{ctx.personal}
{ctx.session}
Effort budget: {skill.effort} ({'phone-only, short' if skill.effort == 'quick' else 'paper/keyboard ok'}).
{style}
End your reply with the final question on its own line, prefixed exactly with:
QUESTION: """
    text = llm.ask(prompt, max_tokens=600)
    # Robust extraction: some models prepend reasoning despite instructions.
    # Take everything after the LAST 'QUESTION:' marker; fall back to the
    # last non-empty paragraph if the marker is missing.
    if "QUESTION:" in text:
        return text.rsplit("QUESTION:", 1)[1].strip()
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    return paragraphs[-1] if paragraphs else text.strip()


def mark_answer(question: str, answer: str, strictness: str = "balanced",
                model_answer: str = "", commentary: str = "") -> tuple[str, str]:
    """Returns (verdict, feedback) where verdict is correct|partial|wrong.
    For bank questions, the canonical answer turns marking from 'solve it
    yourself' into 'compare against this solution' - far more reliable."""
    rubric = MARKING_RUBRICS.get(strictness, MARKING_RUBRICS["balanced"])
    trusted = ""
    if model_answer:
        trusted = (f"\nModel solution (trusted - judge the student against THIS, "
                   f"accepting mathematically equivalent forms):\n{model_answer}\n")
        if commentary:
            trusted += f"Marking guidance: {commentary}\n"
    text = llm.ask(
        f"""Mark this answer. Question: {question}\nAnswer: {answer}\n{trusted}
Rubric: {rubric}
Reply EXACTLY in this format:\nVERDICT: correct | partial | wrong\nFEEDBACK: <=3 sentences.""",
        max_tokens=400,
    )
    verdict = "wrong"
    feedback = text
    for line in text.splitlines():
        low = line.lower()
        if low.startswith("verdict"):
            if "partial" in low:
                verdict = "partial"
            elif "incorrect" in low or "wrong" in low:
                verdict = "wrong"
            elif "correct" in low:
                verdict = "correct"
        elif low.startswith("feedback"):
            feedback = line.split(":", 1)[-1].strip() or text
    return verdict, feedback


# --- the full ask/answer flows (shared by API and scheduler) -------------------

def active_enrollments(db: Session, user_id: int) -> list[Enrollment]:
    return list(db.execute(
        select(Enrollment).where(
            Enrollment.user_id == user_id, Enrollment.status == "active")
    ).scalars())


def open_attempt(db: Session, user_id: int) -> Attempt | None:
    return db.execute(
        select(Attempt)
        .where(Attempt.user_id == user_id, Attempt.verdict == "")
        .order_by(Attempt.asked_at.desc())
    ).scalars().first()


def pick_bank_question(db: Session, user_id: int, skill_id: int) -> Question | None:
    """Least-recently-served-to-this-user first (never-served wins)."""
    qs = db.execute(
        select(Question).where(Question.skill_id == skill_id)
        .order_by(Question.position, Question.id)
    ).scalars().all()
    if not qs:
        return None
    last_served = dict(db.execute(
        select(Attempt.question_id, func.max(Attempt.asked_at))
        .where(Attempt.user_id == user_id,
               Attempt.question_id.in_([q.id for q in qs]))
        .group_by(Attempt.question_id)
    ).all())
    qs.sort(key=lambda q: (last_served.get(q.id) or datetime.min, q.position))
    return qs[0]


def ask_question(db: Session, user: User, enrollments: list[Enrollment],
                 source: str, effort: str | None = None) -> Attempt | None:
    """Pick a skill (focus-aware, guardrailed, fully deterministic), then source
    the question per the enrollment's question_source policy: bank_first (curated,
    fall back to generation), bank_only (trusted set only), generate_only (always
    creative). Scheduled asks respect the repeat cooldown."""
    # FOCUS is a deterministic user choice that overrides interleave.
    if user.focus_enrollment_id:
        focused = [e for e in enrollments if e.id == user.focus_enrollment_id]
        if focused:
            enrollments = focused
    # Guardrail inputs from the last attempt: never repeat it; a SKIP leaves the unit.
    last = db.execute(
        select(Attempt).where(Attempt.user_id == user.id)
        .order_by(Attempt.asked_at.desc())
    ).scalars().first()
    excl_s, excl_u = set(), set()
    if last and last.skill_id:
        excl_s = {last.skill_id}
        if last.verdict == "skipped":
            sk = db.get(Skill, last.skill_id)
            if sk and sk.unit_id:
                excl_u = {sk.unit_id}

    picked = pick_skill(db, enrollments, effort=effort,
                        respect_cooldown=(source == "scheduled"),
                        exclude_skill_ids=excl_s, exclude_unit_ids=excl_u)
    if not picked:
        return None
    skill, _state, enr = picked

    policy = enr.question_source
    bank_q = None
    if policy in ("bank_first", "bank_only"):
        bank_q = pick_bank_question(db, user.id, skill.id)
    if bank_q:
        question, question_id = bank_q.text, bank_q.id
    elif policy == "bank_only":
        return None  # trusted set is empty for every pickable skill's turn
    else:
        question, question_id = generate_question(db, user, skill, enrollment=enr), None

    attempt = Attempt(
        user_id=user.id, enrollment_id=enr.id, skill_id=skill.id,
        question_id=question_id, source=source, question=question,
    )
    db.add(attempt)
    db.flush()
    return attempt


def ensure_question_message(db: Session, attempt: Attempt) -> None:
    """Lazily seed the conversation with the question itself (also covers
    attempts created before conversations existed)."""
    if not attempt.messages:
        attempt.messages.append(AttemptMessage(
            role="tutor", kind="question", content=attempt.question))
        db.flush()


CHAT_HISTORY_TURNS = 12


def chat_turn(db: Session, user: User, attempt: Attempt, text: str,
              modality: str = "text", images: list[str] | None = None) -> bool:
    """One student message in the mini-conversation about the open question.
    The LLM decides: a final answer gets MARKED (closes the attempt, updates
    mastery); anything else gets COACHED - Socratic, no answer-dumping unless
    the student explicitly asks to see the solution. Returns True if closed.

    `images` (base64 photos of handwritten work) are sent to the vision model
    and the turn is treated as a submitted answer."""
    ensure_question_message(db, attempt)
    if images:
        modality = "photo"
        text = text.strip() or "(here is a photo of my working)"
    attempt.messages.append(AttemptMessage(
        role="student", kind="chat", content=text, modality=modality))
    db.flush()

    enr = db.get(Enrollment, attempt.enrollment_id) if attempt.enrollment_id else None
    bank_q = db.get(Question, attempt.question_id) if attempt.question_id else None
    rubric = MARKING_RUBRICS.get(
        enr.marking_strictness if enr else "balanced", MARKING_RUBRICS["balanced"])
    style = STYLE_RULES.get(enr.question_style if enr else "plain", STYLE_RULES["plain"])

    trusted = ""
    if bank_q and bank_q.answer:
        trusted = (f"Trusted model solution (use it to coach and to mark; never "
                   f"paste it wholesale unless the student asks to see the solution):\n"
                   f"{bank_q.answer}\n")
        if bank_q.commentary:
            trusted += f"Marking guidance: {bank_q.commentary}\n"

    history = "\n".join(
        f"{'TUTOR' if m.role == 'tutor' else 'STUDENT'}: {m.content[:400]}"
        for m in attempt.messages[-CHAT_HISTORY_TURNS:]
    )
    spoken = ("\nNote: the student's message was SPOKEN and auto-transcribed - "
              "tolerate homophones, missing symbols and notation artifacts; "
              "interpret charitably.") if modality == "voice" else ""
    photo = ("\nNote: the student attached a PHOTO of their handwritten working - "
             "read it carefully and mark it as their final answer.") if images else ""

    out = llm.ask(f"""You are a friendly expert tutor in a short conversation about ONE practice question.
Question: {attempt.question}
{trusted}Conversation so far:
{history}{spoken}{photo}

Decide what the student's latest message is:
- A FINAL ANSWER to the question -> mark it against the rubric: {rubric}
- Anything else (stuck, confused, asking for a hint, partial thinking, asking to
  see the solution) -> coach: reply in <=4 sentences, Socratic - guide the next
  step, do NOT give the full solution unless they explicitly ask to be shown it.
{style}
Reply EXACTLY in one of these two formats:
MODE: COACH
<your reply>
--- or ---
MODE: MARK
VERDICT: correct | partial | wrong
FEEDBACK: <=3 sentences""", max_tokens=500, images=images)

    mode = "MARK" if ("MODE: MARK" in out or (
        "MODE:" not in out and "VERDICT" in out)) else "COACH"

    if mode == "COACH":
        reply = out.split("MODE: COACH", 1)[-1].strip() if "MODE: COACH" in out else out.strip()
        attempt.messages.append(AttemptMessage(
            role="tutor", kind="chat", content=reply))
        return False

    verdict, feedback = _parse_verdict(out)
    _close_attempt(db, attempt, enr, text, verdict, feedback)
    return True


def followup_turn(db: Session, user: User, attempt: Attempt, text: str,
                  modality: str = "text") -> None:
    """The conversation continues AFTER marking: clarify the feedback, drill
    into why the answer was right/wrong, explore variations. No re-marking,
    no mastery changes - just understanding."""
    ensure_question_message(db, attempt)
    attempt.messages.append(AttemptMessage(
        role="student", kind="chat", content=text, modality=modality))
    db.flush()

    enr = db.get(Enrollment, attempt.enrollment_id) if attempt.enrollment_id else None
    bank_q = db.get(Question, attempt.question_id) if attempt.question_id else None
    style = STYLE_RULES.get(enr.question_style if enr else "plain", STYLE_RULES["plain"])
    trusted = f"Trusted model solution:\n{bank_q.answer}\n" if bank_q and bank_q.answer else ""
    history = "\n".join(
        f"{'TUTOR' if m.role == 'tutor' else 'STUDENT'}: {m.content[:400]}"
        for m in attempt.messages[-CHAT_HISTORY_TURNS:]
    )
    spoken = ("\nNote: the student's message was SPOKEN and auto-transcribed - "
              "interpret charitably.") if modality == "voice" else ""

    reply = llm.ask(f"""You are a friendly expert tutor in a FOLLOW-UP conversation. The question
has already been marked ({attempt.verdict}); the student wants to understand
more - maybe they got it right but feel unsure, or the feedback was unclear.
Question: {attempt.question}
{trusted}Verdict given: {attempt.verdict}. Feedback given: {attempt.feedback}
Conversation so far:
{history}{spoken}

Answer their follow-up clearly and concretely in <=6 sentences. You MAY now
explain the full solution freely. {style}""", max_tokens=500)
    attempt.messages.append(AttemptMessage(role="tutor", kind="chat", content=reply.strip()))


def _parse_verdict(text: str) -> tuple[str, str]:
    verdict, feedback = "wrong", text
    for line in text.splitlines():
        low = line.lower()
        if low.startswith("verdict"):
            if "partial" in low:
                verdict = "partial"
            elif "incorrect" in low or "wrong" in low:
                verdict = "wrong"
            elif "correct" in low:
                verdict = "correct"
        elif low.startswith("feedback"):
            feedback = line.split(":", 1)[-1].strip() or text
    return verdict, feedback


def _close_attempt(db: Session, attempt: Attempt, enr: Enrollment | None,
                   answer: str, verdict: str, feedback: str) -> None:
    attempt.answer = answer
    attempt.verdict = verdict
    attempt.feedback = feedback
    attempt.answered_at = utcnow()
    attempt.messages.append(AttemptMessage(
        role="tutor", kind="feedback", content=feedback))
    user = db.get(User, attempt.user_id)
    if attempt.skill_id and enr:
        st = db.execute(
            select(SkillState).where(
                SkillState.enrollment_id == enr.id,
                SkillState.skill_id == attempt.skill_id,
            )
        ).scalars().first()
        if st:
            update_skill_state(st, verdict)               # deterministic: the numbers
            skill = db.get(Skill, attempt.skill_id)
            if user and skill:                            # LLM: the per-skill memory note
                try:
                    maybe_update_skill_note(db, user, skill, st, verdict)
                except Exception:
                    pass
    if user:
        maybe_update_profile(db, user)


def handle_answer(db: Session, attempt: Attempt, answer: str) -> Attempt:
    """Direct mark path (no coaching round-trip): mark, close, update the
    adaptive state. Records the exchange in the conversation log too."""
    ensure_question_message(db, attempt)
    attempt.messages.append(AttemptMessage(
        role="student", kind="answer", content=answer))
    enr = db.get(Enrollment, attempt.enrollment_id) if attempt.enrollment_id else None
    bank_q = db.get(Question, attempt.question_id) if attempt.question_id else None
    verdict, feedback = mark_answer(
        attempt.question, answer,
        strictness=enr.marking_strictness if enr else "balanced",
        model_answer=bank_q.answer if bank_q else "",
        commentary=bank_q.commentary if bank_q else "")
    _close_attempt(db, attempt, enr, answer, verdict, feedback)
    return attempt
