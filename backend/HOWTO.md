# backend/HOWTO

## First: can your VPS run Docker?

```bash
systemd-detect-virt    # kvm/qemu = real VM -> Docker path. lxc/openvz = container -> systemd path
```

## Path A - Docker (real VM, or container with nesting enabled)

```bash
git clone https://github.com/hawoot/proactive-tutor-agent.git
cd proactive-tutor-agent
cp backend/.env.example backend/.env
nano backend/.env                  # set LLM_API_KEY
docker compose up -d --build
```

Day-to-day:
```bash
docker compose logs -f scheduler            # watch the nudges
git pull && docker compose up -d --build    # update
docker compose down                         # stop (DB survives)
docker compose down -v                      # stop AND wipe DB
```

## Path B - systemd (when Docker can't run inside your container)

```bash
sudo mkdir -p /opt/proactive-tutor-agent && sudo chown $USER /opt/proactive-tutor-agent
git clone https://github.com/hawoot/proactive-tutor-agent.git /opt/proactive-tutor-agent
cd /opt/proactive-tutor-agent/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env && nano .env           # set LLM_API_KEY
sudo cp deploy/tutor-api.service deploy/tutor-scheduler.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tutor-api tutor-scheduler
```

Note: the systemd api unit binds 127.0.0.1. To reach it from your phone, edit
/etc/systemd/system/tutor-api.service -> change --host 127.0.0.1 to --host 0.0.0.0,
then: sudo systemctl daemon-reload && sudo systemctl restart tutor-api

Day-to-day:
```bash
journalctl -u tutor-scheduler -f            # watch the nudges
cd /opt/proactive-tutor-agent && git pull && sudo systemctl restart tutor-api tutor-scheduler
```

## Smoke test (either path)

```bash
curl -X POST localhost:8000/seed
curl -X POST "localhost:8000/question?student_id=1"
curl -X POST localhost:8000/message -H 'content-type: application/json' \
     -d '{"student_id":1,"text":"YOUR ANSWER"}'
```
A marked answer back = it works. From outside: http://VPS_IP:8000
(open the firewall if needed: sudo ufw allow 8000).
Note: no auth yet - fine for self-use, add an API key before real users.

## The database

SQLite = one file (Docker: in the tutor-data volume; systemd: backend/tutor.db).
Auto-created. Nothing to install or deploy. Swap DATABASE_URL to Postgres when
you have real users.

## Switching LLM provider (Anthropic not baked in)

In backend/.env - everything routes through app/llm/:
```ini
LLM_PROVIDER=anthropic           # or: openai_compat (OpenAI, DeepSeek, Ollama...)
LLM_MODEL=claude-sonnet-4-6
LLM_API_KEY=...
LLM_BASE_URL=                    # only for openai_compat, e.g. https://api.deepseek.com/v1
```
Then restart (compose up -d / systemctl restart).
