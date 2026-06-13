"""
Reminder-time computation. NOT a background process.

Notifications are scheduled and fired ON THE DEVICE (the mobile app turns the
user's chosen times into OS-scheduled local notifications - offline, no server,
no push tokens). The server's only job here is to compute, for display, when
the next reminder will fire, from the same times the device uses. There is no
thread, no outbox, no push delivery - that whole chain was removed because it
had too many independent failure points for a feature that cannot fail.
"""
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from sqlalchemy import select
from sqlalchemy.orm import Session
from .models import NudgeTime


def _tz(user) -> ZoneInfo:
    try:
        return ZoneInfo(user.timezone or "UTC")
    except Exception:
        return ZoneInfo("UTC")


def next_nudge_at(db: Session, user, after: datetime) -> datetime | None:
    """The soonest reminder strictly AFTER `after`, as a naive-UTC datetime.

    Walks the user's chosen clock-times in their own timezone over the coming
    week and returns the earliest future match (handling DST via astimezone).
    None when the user has set no times. Pure read - safe to call anywhere."""
    times = list(db.execute(
        select(NudgeTime).where(NudgeTime.user_id == user.id)
    ).scalars())
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
