"""
The agent loop. Stateless: every function loads what it needs, acts, persists.
The LLM phrases and judges; deterministic code owns selection and the mastery
update.

Policy is data, not code: each Enrollment carries toggles (selection strategy,
repeat cooldown, marking strictness, question style). Strategies live in the
SELECTION_STRATEGIES registry - adding one = one function + one entry here,
plus its name in schemas.SelectionStrategy so the API accepts it.
"""
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.orm import Session
from . import llm
from .models import utcnow, User, Enrollment, Skill, SkillState, Attempt
from .retrieval import ContextRetriever, maybe_update_profile


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


# --- selection strategies (the registry behind the policy toggle) -----------
# Each takes (candidates, now) and returns them best-first.
# candidate = (Skill, SkillState, Enrollment)

def _is_due(st: SkillState, now: datetime) -> bool:
    return bool(st.due_at and st.due_at <= now)


def _due_then_weakest(cands, now):
    """Spaced-repetition reviews first, then lowest mastery."""
    return sorted(cands, key=lambda c: (not _is_due(c[1], now), c[1].score))


def _due_then_unseen(cands, now):
    """Reviews first, then skills never attempted (coverage), then weakest."""
    return sorted(cands, key=lambda c: (
        not _is_due(c[1], now), c[1].attempts > 0, c[1].score))


def _round_robin(cands, now):
    """Even rotation: least-recently-seen first (never-seen counts as oldest)."""
    return sorted(cands, key=lambda c: c[1].last_seen_at or datetime.min)


SELECTION_STRATEGIES = {
    "due_then_weakest": _due_then_weakest,
    "due_then_unseen": _due_then_unseen,
    "round_robin": _round_robin,
}


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
               respect_cooldown: bool = True) -> tuple[Skill, SkillState, Enrollment] | None:
    """Rank each enrollment's skills by ITS OWN strategy, take each winner,
    then prefer due over not-due across enrollments.

    Cooldown: a skill seen within the enrollment's repeat_cooldown_hours is
    excluded (unless it is due for review). The scheduler respects this
    strictly (returns None -> no nudge); the on-demand path falls back to the
    best available so an explicit ask always gets a question."""
    now = utcnow()
    winners: list[tuple[Skill, SkillState, Enrollment]] = []
    fallbacks: list[tuple[Skill, SkillState, Enrollment]] = []
    for enr in enrollments:
        ensure_skill_states(db, enr)
        q = (
            select(Skill, SkillState)
            .join(SkillState, SkillState.skill_id == Skill.id)
            .where(SkillState.enrollment_id == enr.id)
        )
        if effort:
            q = q.where(Skill.effort == effort)
        cands = [(s, st, enr) for s, st in db.execute(q).all()]
        if not cands:
            continue
        strategy = SELECTION_STRATEGIES.get(
            enr.selection_strategy, _due_then_weakest)
        ranked = strategy(cands, now)
        fallbacks.append(ranked[0])
        cutoff = now - timedelta(hours=enr.repeat_cooldown_hours)
        cooled = [c for c in ranked
                  if _is_due(c[1], now) or not c[1].last_seen_at or c[1].last_seen_at <= cutoff]
        if cooled:
            winners.append(cooled[0])
    pool = winners or ([] if respect_cooldown else fallbacks)
    if not pool:
        return None
    pool.sort(key=lambda c: (not _is_due(c[1], now), c[1].score))
    return pool[0]


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
Output ONLY the question."""
    return llm.ask(prompt, max_tokens=400)


def mark_answer(question: str, answer: str, strictness: str = "balanced") -> tuple[str, str]:
    """Returns (verdict, feedback) where verdict is correct|partial|wrong."""
    rubric = MARKING_RUBRICS.get(strictness, MARKING_RUBRICS["balanced"])
    text = llm.ask(
        f"""Mark this answer. Question: {question}\nAnswer: {answer}\n
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


def ask_question(db: Session, user: User, enrollments: list[Enrollment],
                 source: str, effort: str | None = None) -> Attempt | None:
    """Pick a skill, phrase a question, persist the open attempt.
    Scheduled asks respect the repeat cooldown; on-demand asks always deliver."""
    picked = pick_skill(db, enrollments, effort=effort,
                        respect_cooldown=(source == "scheduled"))
    if not picked:
        return None
    skill, _state, enr = picked
    question = generate_question(db, user, skill, enrollment=enr)
    attempt = Attempt(
        user_id=user.id, enrollment_id=enr.id, skill_id=skill.id,
        source=source, question=question,
    )
    db.add(attempt)
    db.flush()
    return attempt


def handle_answer(db: Session, attempt: Attempt, answer: str) -> Attempt:
    """Mark the answer, close the attempt, update the adaptive state and
    (periodically) the semantic memory."""
    enr = db.get(Enrollment, attempt.enrollment_id) if attempt.enrollment_id else None
    verdict, feedback = mark_answer(
        attempt.question, answer,
        strictness=enr.marking_strictness if enr else "balanced")
    attempt.answer = answer
    attempt.verdict = verdict
    attempt.feedback = feedback
    attempt.answered_at = utcnow()

    if attempt.skill_id and enr:
        st = db.execute(
            select(SkillState).where(
                SkillState.enrollment_id == enr.id,
                SkillState.skill_id == attempt.skill_id,
            )
        ).scalars().first()
        if st:
            update_skill_state(st, verdict)

    user = db.get(User, attempt.user_id)
    if user:
        maybe_update_profile(db, user)
    return attempt
