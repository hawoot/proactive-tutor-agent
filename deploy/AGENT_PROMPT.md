# Prompts for the hosting-container agent

Copy-paste blocks for a simple agent that has shell access on the container
hosting the backend. Each block is self-contained and tells the agent exactly
what to run and what to report back.

## A. First deployment (or redeploy from scratch)

```
You are deploying a Python web service inside this container. Follow these steps
exactly and report the output of each step. Stop and report if any step fails.

1. Check prerequisites:
   python3 --version    (need 3.10 or newer)
   git --version
   curl --version

2. Get the code (skip clone if the directory already exists):
   git clone https://github.com/hawoot/proactive-tutor-agent.git ~/proactive-tutor-agent
   cd ~/proactive-tutor-agent

3. If an old version was running here before (a supervisord or uvicorn process,
   or an old backend/tutor.db from before June 2026): stop any running uvicorn
   or supervisord processes (pkill -f uvicorn; pkill -f supervisord), and move
   the old database aside: mv backend/tutor.db backend/tutor.db.old 2>/dev/null
   (The schema changed; the old file is demo data only.)

4. Create the config file:
   cp backend/.env.example backend/.env
   Then edit backend/.env and set exactly these two values (I will provide them):
     LLM_API_KEY=<value I give you>
     API_KEY=<value I give you - generate with: openssl rand -hex 24 and TELL ME the generated value>

5. Start it:
   bash deploy/container.sh start
   Expected output: ">> Running (pid ...) - http://localhost:8000"

6. Verify and report ALL of these outputs back to me:
   curl -s localhost:8000/health
   bash deploy/container.sh status
   tail -n 20 backend/tutor.log
   Also report: the API_KEY you generated, and the container's public IP or
   hostname so the phone app can reach port 8000.

7. Confirm port 8000 is reachable from outside the container. If you know the
   host's port-mapping/firewall setup, report it; if not, say so.
```

## B. Update to the latest code (after I push changes)

```
Update the tutor backend in ~/proactive-tutor-agent. Run exactly:

cd ~/proactive-tutor-agent
git pull
bash deploy/container.sh start

(Database migrations run automatically on startup - do NOT touch tutor.db.)
Then verify and report:
curl -s localhost:8000/health
tail -n 20 backend/tutor.log

If 'git pull' shows conflicts or the health check fails, do not retry or
improvise - paste me the full error output.
```

## C. Health check / debugging

```
Diagnose the tutor backend in ~/proactive-tutor-agent. Run and report ALL of:

bash deploy/container.sh status
curl -s localhost:8000/health
tail -n 50 backend/tutor.log
ls -la backend/tutor.db*
df -h .   (disk space)

Do not restart or change anything yet - just report the outputs.
```

## D. Backup the database

```
Back up the tutor database. Run:

cd ~/proactive-tutor-agent/backend
cp tutor.db tutor.backup.$(date +%Y%m%d).db
ls -la tutor*.db

Report the output. The .db file is the entire system state - all content,
all learning progress.
```

## Notes for me (not the agent)

- The whole backend is ONE process (API + embedded scheduler), managed by
  `deploy/container.sh {start|stop|status|logs}`. PID file: `backend/tutor.pid`,
  log: `backend/tutor.log`.
- If the container itself restarts, prompt B brings everything back.
- When you move to a full machine later: install Docker, copy `backend/.env`
  and `backend/tutor.db` over, run `docker compose up -d --build`
  (set `DATABASE_URL` is handled by compose; copy tutor.db into the volume or
  keep SQLite path - see backend/HOWTO.md).
