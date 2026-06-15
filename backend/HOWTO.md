# backend/HOWTO

The backend is **one process**: the FastAPI API. Migrations run automatically
on startup. SQLite by default. Reminders fire ON THE DEVICE (local
notifications at the user's chosen times) - there is no server scheduler; the
server only computes the next reminder time for display.

Pick your deployment:

| | You have | Use |
|---|---|---|
| **Option A** | a bare container (no Docker inside, no systemd) - *current setup* | `deploy/container.sh` |
| **Option B** | a full machine / VM with Docker - *future setup* | `docker compose` |

Switching A -> B later: copy `backend/tutor.db` and `backend/.env` over, done.

## First, on any path: configure

```bash
git clone https://github.com/hawoot/proactive-tutor-agent.git /home/node/apps/labib-agent
cd /home/node/apps/labib-agent
cp backend/.env.example backend/.env
nano backend/.env       # set LLM_API_KEY  and  API_KEY (openssl rand -hex 24)
```

`API_KEY` is what the mobile app puts in its Settings screen. Don't skip it if
the server is reachable from the internet.

## Option A - bare container (no Docker needed)

Needs only `python3` (3.10+) and `curl`.

```bash
bash deploy/container.sh start     # creates venv, installs deps, starts on :8000
```

Day-to-day:
```bash
bash deploy/container.sh status    # is it up? (+ /health output)
bash deploy/container.sh logs      # tail the log
git pull && bash deploy/container.sh start    # update + restart
bash deploy/container.sh stop
```

The DB is the single file `backend/tutor.db` - copy it to back up everything
personal and shared. If the container restarts, run
`bash deploy/container.sh start` again (or add it to whatever startup hook the
host gives you).

## Option B - full machine with Docker

```bash
docker compose up -d --build       # one service: the API
docker compose logs -f             # watch it (nudges included)
git pull && docker compose up -d --build    # update
docker compose down                # stop (DB survives in the tutor-data volume)
```

Scaling further (Postgres, multiple API replicas):
`docker-compose.split.yml` - add `psycopg[binary]>=3.1` to requirements.txt first.

## Smoke test (either path)

```bash
KEY="your API_KEY value"
curl localhost:8000/health                                  # no key needed
curl -X POST localhost:8000/seed -H "X-API-Key: $KEY"       # demo program + user 1
curl -X POST localhost:8000/practice/question -H "X-API-Key: $KEY" \
     -H 'content-type: application/json' -d '{"user_id":1}'
curl -X POST localhost:8000/practice/answer -H "X-API-Key: $KEY" \
     -H 'content-type: application/json' -d '{"user_id":1,"text":"YOUR ANSWER"}'
```

A marked answer back (verdict + feedback) = the whole loop works.
From your phone: `http://SERVER_IP:8000` (port 8000 must be reachable).

Interactive API docs: `http://SERVER_IP:8000/docs` - every endpoint, try-it-out.

## The API in one minute

| Area | Endpoints |
|---|---|
| content | `GET/POST/PATCH/DELETE /programs`, `/units`, `/skills`; `GET /programs/{id}/tree`; `POST /programs/{id}/clone` |
| personal | `GET/POST/PATCH/DELETE /users`, `/devices`, `/notes`, `/enrollments` |
| practice | `GET /practice/open`, `POST /practice/question`, `/practice/answer`, `/practice/skip` |
| insight | `GET /progress`, `/attempts` |

Shared content has `owner_id: null`; pass `?user_id=N` on reads to also see N's
personal content, and on writes to prove ownership.

## The database

- SQLite = one file (`backend/tutor.db`; Docker: in the `tutor-data` volume).
  Auto-created, auto-migrated on startup (Alembic).
- **Changing the schema later**: edit `app/models.py`, then
  ```bash
  cd backend && alembic revision --autogenerate -m "what changed"
  ```
  Commit the generated file in `alembic/versions/`. Every deployment applies it
  automatically on next restart.
- **Postgres upgrade** (when you have real users): set `DATABASE_URL` in `.env`,
  add `psycopg[binary]>=3.1` to requirements, restart. Same migrations apply.

## Switching LLM provider (nothing baked in)

In `backend/.env` - everything routes through `app/llm/`. `.env.example` has
ready-to-uncomment blocks for OpenCode Zen "Go", OpenRouter, OpenAI, and
Anthropic; pick one and drop in your key:
```ini
LLM_PROVIDER=anthropic   # or: openai_compat (OpenAI, OpenRouter, OpenCode, DeepSeek, Ollama...) | fake (offline dev)
LLM_MODEL=claude-sonnet-4-6
LLM_API_KEY=...
LLM_BASE_URL=            # only for openai_compat, e.g. https://openrouter.ai/api/v1
```
Then restart. `LLM_PROVIDER=fake` runs the full loop offline (canned questions) -
useful for testing deployment before spending tokens.

## How the agent picks the next question (the moat - tune it)

Reminders fire ON THE DEVICE: the app turns the user's chosen times into local
OS notifications (offline, no push tokens). `app/reminders.py` only *computes*
the next reminder time so the server can show it. When the learner opens the
app it asks the API for a question, and the agent decides what to drill:
1. **decide**: pick across active enrollments - due-for-review first, else weakest.
2. **phrase**: LLM writes ONE question for that skill (unit material as context).
3. **guardrails**: no immediate repeat; respect the per-skill cooldown unless
   the skill is due (the on-demand path relaxes the cooldown so an explicit ask
   always returns a question).

Tuning lives in `app/agent.py` (skill selection, mastery EMA,
spaced-repetition intervals).

### Per-enrollment policy toggles (not hardcoded)

Each enrollment carries validated switches - `GET /policies` lists every
option, `PATCH /enrollments/{id}` sets them, the app has a "Tutor policy"
editor. Unknown values are rejected (422):

| toggle | options | what it changes |
|---|---|---|
| `selection_strategy` | due_then_weakest / due_then_unseen / round_robin | how the next skill is picked |
| `marking_strictness` | strict / balanced / lenient | the grading rubric given to the LLM |
| `question_style` | plain / latex | plain = phone-friendly notation, no LaTeX |
| `repeat_cooldown_hours` | 0-168 | min hours before re-drilling the same skill |

Adding a strategy = one function + one registry entry in `app/agent.py`
(`SELECTION_STRATEGIES`) + its name in `app/schemas.py`.

## Tests

```bash
cd backend && pip install pytest && python -m pytest tests/ -q
```
Covers the full API: auth, CRUD, ownership guards, clone, practice loop (fake
LLM), next-reminder computation, cascade deletes. Runs on a throwaway DB, no network.
