"""Configuration, loaded from environment (+ backend/.env if present).
Self-contained .env loader so every run mode (docker, bare container, dev
shell) gets the same config with zero extra dependencies."""
import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent


def _load_dotenv() -> None:
    p = BACKEND_DIR / ".env"
    if p.exists():
        for line in p.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


_load_dotenv()

# --- LLM (provider-agnostic - see app/llm/) --------------------------------
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "anthropic")  # anthropic | openai_compat | fake
LLM_MODEL = os.environ.get("LLM_MODEL", "claude-sonnet-4-6")
LLM_API_KEY = os.environ.get("LLM_API_KEY", os.environ.get("ANTHROPIC_API_KEY", ""))
LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "")

# --- storage -----------------------------------------------------------------
# SQLite file by default; switch to Postgres later with one line, e.g.
#   DATABASE_URL=postgresql+psycopg://user:pass@host:5432/tutor
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{BACKEND_DIR / 'tutor.db'}")

# --- API security --------------------------------------------------------------
# If set, every request must carry header  X-API-Key: <value>.
# Leave empty only on a trusted network.
API_KEY = os.environ.get("API_KEY", "")

# --- per-user defaults (each user can override their own values via the API) -
# Reminders are scheduled and fired on the device, so there is no server-side
# scheduler to configure here.
DEFAULT_TIMEZONE = os.environ.get("DEFAULT_TIMEZONE", "UTC")
