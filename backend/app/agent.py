"""
The agent loop. Stateless: every function loads what it needs, acts, persists.
The LLM phrases and judges; deterministic code owns the mastery update.
"""
from datetime import datetime, timedelta
from sqlalchemy import select
from . import llm
from .db import SessionLocal, Student, Enrollment, Skill, Mastery, Interaction


# --- deterministic mastery update (NOT the LLM's job) ---------------------

def update_mastery(m: Mastery, correct: bool) -> None:
    """Elo-ish nudge + spaced-repetition interval. Tune freely; it's your moat."""
    target = 1.0 if correct else 0.0
    m.score += 0.3 * (target - m.score)          # EMA toward outcome
    m.attempts += 1
    m.interval_hours = m.interval_hours * 2 if correct else max(6.0, m.interval_hours / 2)
    m.last_seen = datetime.utcnow()
    m.due_at = m.last_seen + timedelta(hours=m.interval_hours)


# --- the two LLM-backed actions -------------------------------------------

def generate_question(student: Student, skill: Skill) -> str:
    prompt = f"""Set ONE {skill.question_type} question on "{skill.name}".
Learner profile: {student.profile_note or 'unknown'}
Effort budget: {skill.effort} ({'phone-only, short' if skill.effort == 'quick' else 'paper/keyboard ok'}).
Output ONLY the question."""
    return llm.ask(prompt, max_tokens=400)


def mark_answer(question: str, answer: str) -> tuple[bool, str]:
    text = llm.ask(
        f"""Mark this answer. Question: {question}\nAnswer: {answer}\n
Reply EXACTLY:\nVERDICT: correct | partial | wrong\nFEEDBACK: <=3 sentences.""",
        max_tokens=400,
    )
    verdict = text.lower().split("feedback")[0]
    correct = "correct" in verdict and "incorrect" not in verdict
    return correct, text


# --- pick what to drill next (used by the scheduler) ----------------------

def pick_skill(db, enrollment: Enrollment, effort: str | None = None):
    """Due-for-review first, else weakest. Optionally filter by effort (mode)."""
    q = (
        select(Skill, Mastery)
        .join(Mastery, Mastery.skill_id == Skill.id)
        .where(Mastery.enrollment_id == enrollment.id)
    )
    if effort:
        q = q.where(Skill.effort == effort)
    rows = db.execute(q).all()
    if not rows:
        return None
    now = datetime.utcnow()
    rows.sort(key=lambda r: (not (r[1].due_at and r[1].due_at <= now), r[1].score))
    return rows[0]


# --- inbound: the learner replied -----------------------------------------

def handle_answer(student_id: int, answer: str) -> str:
    with SessionLocal() as db:
        last = db.execute(
            select(Interaction)
            .where(Interaction.student_id == student_id, Interaction.verdict == "")
            .order_by(Interaction.ts.desc())
        ).scalars().first()
        if not last:
            return "No open question. Ask for one first."

        correct, feedback = mark_answer(last.question, answer)
        last.answer, last.verdict = answer, "correct" if correct else "missed"

        if last.skill_id and not last.self_directed:
            enr = db.execute(
                select(Enrollment).where(Enrollment.student_id == student_id)
            ).scalars().first()
            if enr:
                m = db.execute(
                    select(Mastery).where(
                        Mastery.enrollment_id == enr.id,
                        Mastery.skill_id == last.skill_id,
                    )
                ).scalars().first()
                if m:
                    update_mastery(m, correct)
        db.commit()
        return feedback
