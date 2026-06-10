"""Configuration, loaded from environment (+ backend/.env if present).
Self-contained .env loader so every run mode (docker, systemd, supervisord,
bare shell) gets the same config with zero extra dependencies."""
import os
from pathlib import Path


def _load_dotenv() -> None:
    p = Path(__file__).resolve().parent.parent / ".env"
    if p.exists():
        for line in p.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


_load_dotenv()

# LLM (provider-agnostic - see app/llm/)
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "anthropic")
LLM_MODEL = os.environ.get("LLM_MODEL", "claude-sonnet-4-6")
LLM_API_KEY = os.environ.get("LLM_API_KEY", os.environ.get("ANTHROPIC_API_KEY", ""))
LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "")

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///tutor.db")

# Deterministic scheduler fence
QUIET_HOURS_START = int(os.environ.get("QUIET_HOURS_START", 21))
QUIET_HOURS_END = int(os.environ.get("QUIET_HOURS_END", 8))
MAX_PROMPTS_PER_DAY = int(os.environ.get("MAX_PROMPTS_PER_DAY", 4))
MIN_GAP_HOURS = int(os.environ.get("MIN_GAP_HOURS", 2))

TELEGRAM_TOKEN = os.environ.get("TELEGRAM_TOKEN", "")
