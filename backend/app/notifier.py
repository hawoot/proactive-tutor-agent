"""
Delivery is channel-agnostic AND decoupled (outbox pattern):

  queue_notification()  - the scheduler/agent calls this. It only INSERTs
                          'queued' rows into notification_log: fast,
                          transactional, never blocks a decision on a slow
                          push provider.
  dispatch_pending()    - drains queued rows and actually delivers, with
                          retries. Today it runs in-process on the scheduler
                          tick (SQL as the queue - fine for thousands of
                          users). At scale, run the SAME function from
                          dedicated worker processes, or replace its internals
                          with Redis/SQS - nothing upstream changes.

A Notifier subclass decides HOW a message reaches a device. Add a channel =
add a subclass.
"""
from abc import ABC, abstractmethod
import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session
from . import config
from .models import utcnow, Device, NotificationLog

MAX_DELIVERY_ATTEMPTS = 3


class Notifier(ABC):
    @abstractmethod
    def send(self, channel_ref: str, message: str) -> None: ...


class ConsoleNotifier(Notifier):
    """Dev default - prints to stdout so you can watch the loop with zero setup."""
    def send(self, channel_ref: str, message: str) -> None:
        print(f"\n[NUDGE -> {channel_ref}]\n{message}\n")


class TelegramNotifier(Notifier):
    def send(self, channel_ref: str, message: str) -> None:
        r = httpx.post(
            f"https://api.telegram.org/bot{config.TELEGRAM_TOKEN}/sendMessage",
            json={"chat_id": channel_ref, "text": message}, timeout=10,
        )
        r.raise_for_status()


class ExpoPushNotifier(Notifier):
    """channel_ref is the Expo push token the mobile app registers via /devices."""
    def send(self, channel_ref: str, message: str) -> None:
        r = httpx.post(
            "https://exp.host/--/api/v2/push/send",
            json={"to": channel_ref, "title": "Your tutor", "body": message},
            timeout=10,
        )
        r.raise_for_status()


def get_notifier(channel: str) -> Notifier:
    if channel == "telegram" and config.TELEGRAM_TOKEN:
        return TelegramNotifier()
    if channel == "push":
        return ExpoPushNotifier()
    return ConsoleNotifier()


# --- outbox: write side ------------------------------------------------------

def queue_notification(db: Session, user_id: int, devices: list[Device],
                       message: str) -> int:
    """Enqueue one delivery per active device (console fallback if none).
    Returns the number of rows queued. No network I/O happens here."""
    if not devices:
        db.add(NotificationLog(
            user_id=user_id, channel="console",
            channel_ref=f"user:{user_id}", body=message))
        return 1
    for d in devices:
        db.add(NotificationLog(
            user_id=user_id, device_id=d.id, channel=d.channel,
            channel_ref=d.channel_ref, body=message))
    return len(devices)


# --- outbox: drain side ----------------------------------------------------------

def dispatch_pending(db: Session, limit: int = 50) -> int:
    """Deliver queued notifications. Each row gets MAX_DELIVERY_ATTEMPTS tries
    (re-picked on later ticks) before being marked failed. Returns sent count."""
    rows = db.execute(
        select(NotificationLog)
        .where(NotificationLog.status == "queued")
        .order_by(NotificationLog.id).limit(limit)
    ).scalars().all()
    sent = 0
    for n in rows:
        n.attempts += 1
        try:
            get_notifier(n.channel).send(n.channel_ref, n.body)
            n.status = "sent"
            n.delivered_at = utcnow()
            n.error = ""
            sent += 1
        except Exception as e:
            n.error = str(e)[:500]
            if n.attempts >= MAX_DELIVERY_ATTEMPTS:
                n.status = "failed"
    return sent
