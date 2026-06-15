# Proactive Tutor Agent

An exam-aware, **proactive** tutoring agent. The moat is not explanation (any LLM
does that) - it is **deciding what to drill next** (due-for-review vs weakest,
spaced repetition) over curated unit-tree material, surfaced through on-device
reminders at the learner's chosen times. The agent chases the learner.

## Repo map

```
backend/   FastAPI + SQLAlchemy + Alembic + swappable LLM   -> backend/HOWTO.md
mobile/    Expo (React Native) app: practice, library CRUD, progress    -> mobile/HOWTO.md
deploy/    container.sh (bare-container deploy) + AGENT_PROMPT.md
```

Each half is independent: the backend runs and is testable with curl alone; the
mobile app is a thin client over the backend's HTTP API.

## The data model (the bread and butter)

Two segregated domains, linked only through enrollments:

```
CONTENT (shareable library)              PERSONAL (one learner's world)
  Program  ── owner_id NULL = shared       User          prefs: timezone, daily goal
    └── Unit (recursive tree, material)    Device        push token / telegram / console
    └── Skill (atomic, masterable)         Enrollment ── user <-> program + exam date
                                             └── SkillState  score, attempts, due_at (spaced rep)
                                           Attempt       append-only Q/A log
                                           Note          private annotation on shared content
```

- **Personal vs shared in one column**: `Program.owner_id` NULL = in the library
  for everyone; set = private to that user. Units/skills inherit it. "Fork" shared
  content with one call (`POST /programs/{id}/clone`).
- **Enrichment is automatic**: add a skill to a program and every enrolled learner
  picks it up (SkillState rows are created lazily on selection).
- **Schema evolution is managed**: Alembic migrations run automatically on startup.
  `git pull && restart` is the whole upgrade. SQLite today, Postgres later via one
  env var.

## Architecture in one breath

- **Engine vs curriculum**: the engine (memory, selection, mastery) is
  invariant; a subject is just data (a `Program` + unit tree + skills).
- **LLM vs state**: the LLM is a swappable brain behind `backend/app/llm/`
  (Anthropic, OpenAI-compatible, or `fake` for offline dev - one env switch). The
  tutor that "grows" is the accumulated state in the DB, never a process or model.
- **Deterministic core, LLM at the edges**: skill selection (due -> weakest),
  mastery and spaced repetition are owned, tunable code; the LLM only phrases
  and marks.
- **Reminders fire on the device**: the app schedules local notifications at the
  learner's chosen times (offline, no push tokens, no server loop); the server
  only computes the next reminder time for display (`app/reminders.py`).
- **One process by default**: the backend is just the API, so it deploys as a
  single process - perfect for a bare container (`docker-compose.split.yml` adds
  Postgres and API replicas when you outgrow SQLite).

## Quick start (dev, no API key needed)

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
LLM_PROVIDER=fake uvicorn app.main:app --reload   # migrations run automatically
curl -X POST localhost:8000/seed
```

Tests: `python -m pytest tests/ -q` (full API loop on a throwaway DB, no network).

## Phases

0. (now) backend + one program, self-use; mobile v2 talking to it
1. real push via a dev build; public-domain content (Gutenberg-safe)
2. payments, more programs
3. (maybe) third-party publishing; buy-your-own-copy uploads

Design for 3; build 0.
