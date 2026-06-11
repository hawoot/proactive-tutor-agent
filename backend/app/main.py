"""
The HTTP API. Every transport (mobile app, curl, future web) hits these
endpoints - the backend is channel-blind.

Dev run:   uvicorn app.main:app --reload
Prod run:  see backend/HOWTO.md (migrations run automatically on startup;
           the scheduler runs embedded unless SCHEDULER_MODE=off).
"""
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import config
from .db import get_db, run_migrations
from .security import require_api_key
from .routers import users, devices, library, notes, enrollments, practice, progress
from . import seed as seed_module
from . import scheduler


@asynccontextmanager
async def lifespan(_: FastAPI):
    run_migrations()
    stop = scheduler.start_embedded() if config.SCHEDULER_MODE == "embedded" else None
    yield
    if stop:
        stop.set()


app = FastAPI(
    title="Proactive Tutor Agent",
    version="2.0",
    lifespan=lifespan,
    dependencies=[Depends(require_api_key)],
)
app.add_middleware(  # lets the Expo dev app call the API during development
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

for r in (users, devices, library, notes, enrollments, practice, progress):
    app.include_router(r.router)


@app.get("/health")
def health():
    return {
        "ok": True,
        "ts": datetime.utcnow().isoformat(),
        "scheduler": config.SCHEDULER_MODE,
        "auth": bool(config.API_KEY),
    }


@app.post("/seed")
def seed(db: Session = Depends(get_db)):
    """One-shot demo seed: a shared A-level maths program + an enrolled user."""
    return seed_module.seed(db)


@app.get("/policies")
def policies():
    """The valid values for every enrollment policy toggle - clients (and
    agents) discover the switches instead of hardcoding them."""
    from . import agent
    return {
        "selection_strategy": {
            "options": list(agent.SELECTION_STRATEGIES),
            "default": "due_then_weakest",
            "description": "How the next skill is picked.",
        },
        "marking_strictness": {
            "options": list(agent.MARKING_RUBRICS),
            "default": "balanced",
            "description": "How generously answers are graded.",
        },
        "question_style": {
            "options": list(agent.STYLE_RULES),
            "default": "plain",
            "description": "plain = phone-friendly notation; latex = allow LaTeX.",
        },
        "question_source": {
            "options": ["bank_first", "bank_only", "generate_only"],
            "default": "bank_first",
            "description": "bank first = curated questions, generate as fallback; "
                           "bank only = trusted set only; generate only = always creative.",
        },
        "repeat_cooldown_hours": {
            "min": 0, "max": 168, "default": 6,
            "description": "Hours before the same skill can be drilled again (unless due for review).",
        },
    }
