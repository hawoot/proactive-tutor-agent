"""
The scheduler - the product's moat. Pure, deterministic decisions over good
state. Pipeline per due user:  pick-time -> fence -> ask -> notify -> reschedule

Scheduling model: the user picks EXACT clock times to be nudged (e.g. 11:00,
13:00, 17:00 on chosen weekdays), in their own timezone. The scheduler fires
at each. No times set = no scheduled nudges. This replaced the old "allowed
windows + cadence" model, which users found hard to reason about.

Two run modes (config.SCHEDULER_MODE):
  embedded   : a background thread inside the API process - the default, and
               what the single-container deployment uses.
  standalone : its own process (python -m app.scheduler) for the scaled-up
               docker-compose deployment; set SCHEDULER_MODE=off on the API.
"""
import threading
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from . import config, agent
from .db import SessionLocal
from .models import utcnow, User, Device, Enrollment, NotificationLog, NudgeTime
from .notifier import queue_notification, dispatch_pending


# --- timezone helpers --------------------------------------------------------

def _tz(user: User) -> ZoneInfo:
    try:
        return ZoneInfo(user.timezone or "UTC")
    except Exception:
        return ZoneInfo("UTC")


def _nudge_times(db: Session, user_id: int) -> list[NudgeTime]:
    return list(db.execute(
        select(NudgeTime).where(NudgeTime.user_id == user_id)
    ).scalars())


def next_nudge_at(db: Session, user: User, after: datetime) -> datetime | None:
    """The soonest nudge strictly AFTER `after`, as a naive-UTC datetime.

    Walks the user's chosen clock-times in their own timezone over the coming
    week and returns the earliest future match (handling DST via astimezone).
    Returns None when the user has set no nudge times - i.e. nudges are off.
    This is the single source of truth for 'when is the next ping?', so the
    home screen and the scheduler can never disagree."""
    times = _nudge_times(db, user.id)
    if not times:
        return None
    tz = _tz(user)
    local_after = after.replace(tzinfo=ZoneInfo("UTC")).astimezone(tz)
    best: datetime | None = None
    for offset in range(0, 8):  # today .. +7 days covers every weekday
        day = local_after + timedelta(days=offset)
        for t in times:
            if t.weekday != day.weekday():
                continue
            cand = day.replace(hour=t.hour, minute=t.minute, second=0, microsecond=0)
            if cand <= local_after:
                continue
            cand_utc = cand.astimezone(ZoneInfo("UTC")).replace(tzinfo=None)
            if best is None or cand_utc < best:
                best = cand_utc
    return best


# --- the fence: deterministic hard rules (never the LLM's call) ------------

def nudges_today(db: Session, user_id: int, now: datetime) -> int:
    # Counts by INTENT (queued time), so failed/pending deliveries still
    # throttle - the cap is about not spamming decisions, not about delivery.
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return db.execute(
        select(func.count(NotificationLog.id)).where(
            NotificationLog.user_id == user_id,
            NotificationLog.sent_at >= start,
        )
    ).scalar() or 0


def fence_blocks(db: Session, user: User, now: datetime) -> bool:
    """A scheduled time arrived - may we actually nudge? The time itself is the
    schedule; these are the only safety rails left."""
    if nudges_today(db, user.id, now) >= user.max_prompts_per_day:
        return True
    # don't stack on an unanswered prompt
    return agent.open_attempt(db, user.id) is not None


# --- one decision for one user -----------------------------------------------

# When there's nothing to schedule (no times, or no enrollment), park the user
# this far out instead of re-evaluating every tick.
_PARK = timedelta(hours=6)


def decide_for(db: Session, user: User, now: datetime) -> None:
    nxt = next_nudge_at(db, user, now)
    if nxt is None:
        user.next_decision_at = now + _PARK  # no times set -> never auto-nudge
        return

    enrollments = agent.active_enrollments(db, user.id)
    if not enrollments or fence_blocks(db, user, now):
        user.next_decision_at = nxt  # honour the schedule, skip this slot
        return

    attempt = agent.ask_question(db, user, enrollments, source="scheduled")
    if attempt:
        devices = list(db.execute(
            select(Device).where(Device.user_id == user.id, Device.is_active == True)  # noqa: E712
        ).scalars())
        # Only ENQUEUE here (outbox) - delivery happens in the dispatch phase,
        # so a slow push provider can never stall the decision loop.
        queue_notification(db, user.id, devices, attempt.question)

    user.next_decision_at = nxt


# --- the ticker -----------------------------------------------------------------

def tick() -> None:
    now = utcnow()
    with SessionLocal() as db:
        due = db.execute(
            select(User).where(
                (User.next_decision_at == None) | (User.next_decision_at <= now)  # noqa: E711
            )
        ).scalars().all()
        for user in due:
            decide_for(db, user, now)
        db.commit()
    # Drain the outbox in its own transaction (and process - see notifier.py).
    with SessionLocal() as db:
        dispatch_pending(db)
        db.commit()


def run_loop(poll_seconds: int, stop: threading.Event | None = None) -> None:
    print(f"Scheduler running (poll every {poll_seconds}s).")
    while not (stop and stop.is_set()):
        try:
            tick()
        except Exception as e:  # keep the ticker alive
            print("scheduler tick error:", e)
        if stop:
            stop.wait(poll_seconds)
        else:
            time.sleep(poll_seconds)


def start_embedded() -> threading.Event:
    """Run the loop in a daemon thread inside the API process."""
    stop = threading.Event()
    threading.Thread(
        target=run_loop, args=(config.SCHEDULER_POLL_SECONDS, stop),
        name="scheduler", daemon=True,
    ).start()
    return stop


if __name__ == "__main__":  # standalone mode
    from .db import run_migrations
    run_migrations()
    run_loop(config.SCHEDULER_POLL_SECONDS)
