"""
The scheduler - the product's moat. Pure, deterministic decisions over good state.
Run as its own process:  python -m app.scheduler

Pipeline per due student:  fence -> decide -> phrase -> notify -> reschedule
"""
import time
from datetime import datetime, timedelta
from sqlalchemy import select
from . import config, agent
from .db import SessionLocal, Student, Enrollment, Interaction, init_db
from .notifier import get_notifier


# --- the fence: deterministic hard rules (never the LLM's call) -----------

def within_quiet_hours(now: datetime) -> bool:
    h = now.hour
    s, e = config.QUIET_HOURS_START, config.QUIET_HOURS_END
    return (h >= s or h < e) if s > e else (s <= h < e)

def prompts_today(db, student_id: int, now: datetime) -> int:
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return len(db.execute(
        select(Interaction).where(
            Interaction.student_id == student_id, Interaction.ts >= start
        )
    ).scalars().all())

def fence_blocks(db, student: Student, now: datetime) -> bool:
    if within_quiet_hours(now):
        return True
    if prompts_today(db, student.id, now) >= config.MAX_PROMPTS_PER_DAY:
        return True
    # don't stack on an unanswered prompt
    open_q = db.execute(
        select(Interaction).where(
            Interaction.student_id == student.id, Interaction.verdict == ""
        )
    ).scalars().first()
    return open_q is not None


# --- decide intensity: exam proximity tightens the cadence ----------------

def next_gap_hours(enrollment: Enrollment, now: datetime) -> float:
    base = max(config.MIN_GAP_HOURS, 24)
    if enrollment.exam_date:
        days = (enrollment.exam_date - now).days
        if days <= 7:
            return max(config.MIN_GAP_HOURS, 4)
        if days <= 30:
            return max(config.MIN_GAP_HOURS, 12)
    return base


# --- one decision for one student -----------------------------------------

def decide_for(db, student: Student, now: datetime) -> None:
    if fence_blocks(db, student, now):
        student.next_decision_at = now + timedelta(hours=1)
        return

    enr = db.execute(
        select(Enrollment).where(Enrollment.student_id == student.id)
    ).scalars().first()
    if not enr:
        student.next_decision_at = now + timedelta(hours=6)
        return

    picked = agent.pick_skill(db, enr)
    if picked:
        skill, _mastery = picked
        question = agent.generate_question(student, skill)
        db.add(Interaction(student_id=student.id, skill_id=skill.id, question=question))
        get_notifier(student.channel).send(student.channel_ref, question)

    student.next_decision_at = now + timedelta(hours=next_gap_hours(enr, now))


# --- the ticker -----------------------------------------------------------

def tick() -> None:
    now = datetime.utcnow()
    with SessionLocal() as db:
        due = db.execute(
            select(Student).where(
                (Student.next_decision_at == None) | (Student.next_decision_at <= now)  # noqa: E711
            )
        ).scalars().all()
        for student in due:
            decide_for(db, student, now)
        db.commit()


def run(poll_seconds: int = 60) -> None:
    init_db()
    print("Scheduler running. Polling every", poll_seconds, "s.")
    while True:
        try:
            tick()
        except Exception as e:  # keep the ticker alive
            print("tick error:", e)
        time.sleep(poll_seconds)


if __name__ == "__main__":
    run()
