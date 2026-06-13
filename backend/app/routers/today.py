"""GET /today - the single call behind the home-screen timeline: streak,
daily goal, the open question, what the agent has scheduled, and recent
history. The agent's plan, made visible."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from .. import agent
from ..db import get_db
from ..models import utcnow, Attempt, Enrollment, SkillState
from ..schemas import AttemptOut
from ..scheduler import next_nudge_at
from .users import get_user_or_404

router = APIRouter(tags=["today"])


def _attempt_out(a: Attempt) -> AttemptOut:
    item = AttemptOut.model_validate(a)
    item.skill_name = a.skill.name if a.skill else ""
    item.from_bank = a.question_id is not None
    return item


def _streak_days(db: Session, user_id: int, today) -> int:
    """Consecutive days (UTC) with at least one marked answer, counting back
    from today - or from yesterday, so an unplayed today doesn't kill it."""
    days = {
        d.date() for (d,) in db.execute(
            select(Attempt.answered_at).where(
                Attempt.user_id == user_id, Attempt.answered_at != None)  # noqa: E711
        ) if d
    }
    if today in days:
        cursor = today
    elif (today - timedelta(days=1)) in days:
        cursor = today - timedelta(days=1)
    else:
        return 0
    streak = 0
    while cursor in days:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


@router.get("/today")
def today(user_id: int, db: Session = Depends(get_db)):
    user = get_user_or_404(db, user_id)
    now = utcnow()
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(days=1)

    answered_today = db.execute(
        select(func.count(Attempt.id)).where(
            Attempt.user_id == user_id, Attempt.answered_at >= day_start)
    ).scalar() or 0

    open_attempt = agent.open_attempt(db, user_id)

    active = agent.active_enrollments(db, user_id)
    active_ids = [e.id for e in active]
    due_now = due_today = 0
    if active_ids:
        due_now = db.execute(
            select(func.count(SkillState.id)).where(
                SkillState.enrollment_id.in_(active_ids), SkillState.due_at <= now)
        ).scalar() or 0
        due_today = db.execute(
            select(func.count(SkillState.id)).where(
                SkillState.enrollment_id.in_(active_ids), SkillState.due_at <= day_end)
        ).scalar() or 0

    exams = [{
        "enrollment_id": e.id,
        "program_title": e.program.title if e.program else "",
        "exam_date": e.exam_date.isoformat(),
        "days_left": (e.exam_date - now).days,
    } for e in active if e.exam_date]

    recent = db.execute(
        select(Attempt).where(Attempt.user_id == user_id, Attempt.verdict != "")
        .order_by(Attempt.asked_at.desc()).limit(10)
    ).scalars().all()

    # Compute the next ping live from the user's chosen times, so it's always
    # accurate (never a stale parked value) and matches the scheduler exactly.
    nxt = next_nudge_at(db, user, now)

    return {
        "streak_days": _streak_days(db, user_id, now.date()),
        "answered_today": answered_today,
        "daily_goal": user.daily_goal,
        "open_attempt": _attempt_out(open_attempt) if open_attempt else None,
        "next_nudge_at": nxt.isoformat() if nxt else None,
        "due_now": due_now,
        "due_today": due_today,
        "exams": sorted(exams, key=lambda e: e["days_left"]),
        "has_active_enrollment": bool(active),
        "recent": [_attempt_out(a) for a in recent],
    }
