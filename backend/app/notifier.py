"""
Delivery is channel-agnostic. The scheduler decides WHAT to send and to WHOM; a
Notifier decides HOW it reaches the device. Add a channel = add a subclass.
"""
from abc import ABC, abstractmethod
import httpx
from . import config


class Notifier(ABC):
    @abstractmethod
    def send(self, channel_ref: str, message: str) -> None: ...


class ConsoleNotifier(Notifier):
    """Dev default - prints to stdout so you can watch the loop with zero setup."""
    def send(self, channel_ref: str, message: str) -> None:
        print(f"\n[NUDGE -> {channel_ref}]\n{message}\n")


class TelegramNotifier(Notifier):
    def send(self, channel_ref: str, message: str) -> None:
        httpx.post(
            f"https://api.telegram.org/bot{config.TELEGRAM_TOKEN}/sendMessage",
            json={"chat_id": channel_ref, "text": message}, timeout=10,
        )


class ExpoPushNotifier(Notifier):
    """channel_ref is the Expo push token the mobile app registers via /register_device."""
    def send(self, channel_ref: str, message: str) -> None:
        httpx.post(
            "https://exp.host/--/api/v2/push/send",
            json={"to": channel_ref, "title": "Your tutor", "body": message},
            timeout=10,
        )


def get_notifier(channel: str) -> Notifier:
    if channel == "telegram" and config.TELEGRAM_TOKEN:
        return TelegramNotifier()
    if channel == "push":
        return ExpoPushNotifier()
    return ConsoleNotifier()
