"""
Delivery is channel-agnostic. The scheduler decides WHAT to send and to WHOM;
a Notifier decides HOW it reaches the device. Every send is recorded in
notification_log (success or failure) - that log also powers the daily cap.
"""
from abc import ABC, abstractmethod
import httpx
from sqlalchemy.orm import Session
from . import config
from .models import Device, NotificationLog


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


def notify_user(db: Session, user_id: int, devices: list[Device], message: str) -> bool:
    """Send to every active device; log each outcome. Returns True if any send
    succeeded (console counts - it is the zero-setup dev channel)."""
    if not devices:
        devices = [Device(id=None, user_id=user_id, channel="console", channel_ref=f"user:{user_id}")]
    any_ok = False
    for d in devices:
        log = NotificationLog(
            user_id=user_id, device_id=d.id, channel=d.channel, body=message)
        try:
            get_notifier(d.channel).send(d.channel_ref, message)
            any_ok = True
        except Exception as e:
            log.status, log.error = "failed", str(e)[:500]
        db.add(log)
    return any_ok
