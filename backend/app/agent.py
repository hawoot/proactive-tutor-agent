"""
The agent loop. Stateless: every function loads what it needs, acts, persists.
The LLM phrases and judges; deterministic code owns selection and the mastery
update.
"""
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.orm import Session
from . import llm
from .models import (
    utcnow, User, Enrollment, Skill, SkillState, Attempt, Unit,
)


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


# --- skill selection ----------------------------------------------------------

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


def pick_skill(db: Session, enrollments: list[Enrollment],
               effort: str | None = None) -> tuple[Skill, SkillState, Enrollment] | None:
    """Due-for-review first, then weakest, across the given enrollments."""
    candidates: list[tuple[Skill, SkillState, Enrollment]] = []
    for enr in enrollments:
        ensure_skill_states(db, enr)
        q = (
            select(Skill, SkillState)
            .join(SkillState, SkillState.skill_id == Skill.id)
            .where(SkillState.enrollment_id == enr.id)
        )
        if effort:
            q = q.where(Skill.effort == effort)
        candidates += [(s, st, enr) for s, st in db.execute(q).all()]
    if not candidates:
        return None
    now = utcnow()
    candidates.sort(key=lambda c: (not (c[1].due_at and c[1].due_at <= now), c[1].score))
    return candidates[0]


# --- the two LLM-backed actions ----------------------------------------------

def generate_question(db: Session, user: User, skill: Skill) -> str:
    unit_context = ""
    if skill.unit_id:
        unit = db.get(Unit, skill.unit_id)
        if unit and unit.content:
            unit_context = f"Source material (stay within it):\n{unit.content[:2000]}\n"
    prompt = f"""Set ONE {skill.question_type} question on "{skill.name}".
{f'Skill notes: {skill.description}' if skill.description else ''}
{unit_context}Learner profile: {user.profile_note or 'unknown'}
Effort budget: {skill.effort} ({'phone-only, short' if skill.effort == 'quick' else 'paper/keyboard ok'}).
Output ONLY the question."""
    return llm.ask(prompt, max_tokens=400)


def mark_answer(question: str, answer: str) -> tuple[str, str]:
    """Returns (verdict, feedback) where verdict is correct|partial|wrong."""
    text = llm.ask(
        f"""Mark this answer. Question: {question}\nAnswer: {answer}\n
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
    """Pick a skill, phrase a question, persist the open attempt."""
    picked = pick_skill(db, enrollments, effort=effort)
    if not picked:
        return None
    skill, _state, enr = picked
    question = generate_question(db, user, skill)
    attempt = Attempt(
        user_id=user.id, enrollment_id=enr.id, skill_id=skill.id,
        source=source, question=question,
    )
    db.add(attempt)
    db.flush()
    return attempt


def handle_answer(db: Session, attempt: Attempt, answer: str) -> Attempt:
    """Mark the answer, close the attempt, update the adaptive state."""
    verdict, feedback = mark_answer(attempt.question, answer)
    attempt.answer = answer
    attempt.verdict = verdict
    attempt.feedback = feedback
    attempt.answered_at = utcnow()

    if attempt.skill_id and attempt.enrollment_id:
        st = db.execute(
            select(SkillState).where(
                SkillState.enrollment_id == attempt.enrollment_id,
                SkillState.skill_id == attempt.skill_id,
            )
        ).scalars().first()
        if st:
            update_skill_state(st, verdict)
    return attempt
