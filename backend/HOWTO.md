# backend/HOWTO

Commands are tagged with WHERE to run them:
`[LAPTOP]` = your machine. `[agent37]` = your VPS over SSH. For local-only dev,
run everything on the laptop and ignore the VPS sections.

## 1. Install & configure

`[LAPTOP or agent37]` - from the repo root:
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
nano .env        # set LLM_PROVIDER / LLM_MODEL / LLM_API_KEY (see section 4)
```

## 2. The database - what "deploying the DB" means here: nothing

SQLite is not a server. It is **one file** (`tutor.db`) that the app creates by
itself on first startup, right next to the code. There is nothing to install,
start, host, or deploy. Back it up by copying the file. Delete it to reset.

When you later have concurrent real users, you swap `DATABASE_URL` to a Postgres
URL and run a Postgres container - that is the day a DB needs deploying. Not now.

## 3. Run it

`[LAPTOP or agent37]` - terminal 1, the API:
```bash
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
(`--host 0.0.0.0` so your phone can reach it on the same Wi-Fi for the mobile app.)

Terminal 2 - seed + smoke test (`/question` skips the scheduling fence, instant):
```bash
curl -X POST localhost:8000/seed
curl -X POST "localhost:8000/question?student_id=1"
curl -X POST localhost:8000/message -H 'content-type: application/json' \
     -d '{"student_id":1,"text":"YOUR ANSWER HERE"}'
curl "localhost:8000/progress?student_id=1"
```
A marked answer back = the brain works.

Terminal 3 - the proactive side (the actual product):
```bash
source .venv/bin/activate
python -m app.scheduler     # polls every 60s; prints a nudge to console when due
```

## 4. Switching LLM provider (Anthropic is NOT baked in)

Everything goes through `app/llm/` - the rest of the code only calls `llm.ask()`.
Pick a provider in `.env`:

```ini
# Anthropic (default)
LLM_PROVIDER=anthropic
LLM_MODEL=claude-sonnet-4-6
LLM_API_KEY=sk-ant-...

# Any OpenAI-compatible API - OpenAI, DeepSeek, Mistral, local Ollama/vLLM...
LLM_PROVIDER=openai_compat
LLM_MODEL=deepseek-chat
LLM_API_KEY=sk-...
LLM_BASE_URL=https://api.deepseek.com/v1
# local Ollama example: LLM_BASE_URL=http://localhost:11434/v1  LLM_API_KEY=ollama
```

Adding another vendor = one new file in `app/llm/` + one `elif` in its
`__init__.py`. Nothing else changes.

## 5. Always-on on the VPS (later, when you're done with local dev)

`[agent37]`
```bash
sudo mkdir -p /opt/proactive-tutor-agent && sudo chown $USER /opt/proactive-tutor-agent
git clone https://github.com/hawoot/proactive-tutor-agent.git /opt/proactive-tutor-agent
cd /opt/proactive-tutor-agent/backend
python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
cp .env.example .env && nano .env
sudo cp deploy/tutor-api.service deploy/tutor-scheduler.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tutor-api tutor-scheduler
```
Run **exactly one** scheduler instance - two would double-fire every nudge.
`deploy/nginx.conf` + certbot when you want a public HTTPS domain.

## 6. Updating

```bash
cd /opt/proactive-tutor-agent && git pull
sudo systemctl restart tutor-api tutor-scheduler
```
