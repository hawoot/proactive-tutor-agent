"""
The scheduler - the product's moat. Pure, deterministic decisions over good
state. Pipeline per due user:  fence -> decide -> phrase -> notify -> reschedule

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
from .models import utcnow, User, Device, Enrollment, NotificationLog
from .notifier import queue_notification, dispatch_pending


# --- the fence: deterministic hard rules (never the LLM's call) ------------

def local_hour(user: User, now: datetime) -> int:
    try:
        tz = ZoneInfo(user.timezone or "UTC")
    except Exception:
        tz = ZoneInfo("UTC")
    return now.replace(tzinfo=ZoneInfo("UTC")).astimezone(tz).hour


def within_quiet_hours(user: User, now: datetime) -> bool:
    h = local_hour(user, now)
    s, e = user.quiet_hours_start, user.quiet_hours_end
    return (h >= s or h < e) if s > e else (s <= h < e)


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
    if within_quiet_hours(user, now):
        return True
    if nudges_today(db, user.id, now) >= user.max_prompts_per_day:
        return True
    # don't stack on an unanswered prompt
    return agent.open_attempt(db, user.id) is not None


# --- decide intensity: exam proximity tightens the cadence ------------------

def next_gap_hours(enrollments: list[Enrollment], now: datetime) -> float:
    gap = max(config.MIN_GAP_HOURS, 24)
    for enr in enrollments:
        if enr.exam_date:
            days = (enr.exam_date - now).days
            if days <= 7:
                gap = min(gap, max(config.MIN_GAP_HOURS, 4))
            elif days <= 30:
                gap = min(gap, max(config.MIN_GAP_HOURS, 12))
    return gap


# --- one decision for one user -----------------------------------------------

def decide_for(db: Session, user: User, now: datetime) -> None:
    if fence_blocks(db, user, now):
        user.next_decision_at = now + timedelta(hours=1)
        return

    enrollments = agent.active_enrollments(db, user.id)
    if not enrollments:
        user.next_decision_at = now + timedelta(hours=6)
        return

    attempt = agent.ask_question(db, user, enrollments, source="scheduled")
    if attempt:
        devices = list(db.execute(
            select(Device).where(Device.user_id == user.id, Device.is_active == True)  # noqa: E712
        ).scalars())
        # Only ENQUEUE here (outbox) - delivery happens in the dispatch phase,
        # so a slow push provider can never stall the decision loop.
        queue_notification(db, user.id, devices, attempt.question)

    user.next_decision_at = now + timedelta(hours=next_gap_hours(enrollments, now))


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
