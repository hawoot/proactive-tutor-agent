#!/usr/bin/env bash
# One-shot VPS deploy. From the repo root:   bash deploy.sh
# Auto-detects, in order: Docker -> systemd -> supervisord (pure userspace).
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo ">> Created backend/.env - set your LLM_API_KEY:"
  echo ">>   nano backend/.env    then re-run:  bash deploy.sh"
  exit 1
fi

if docker info >/dev/null 2>&1; then
  echo ">> Docker available - deploying with compose"
  docker compose up -d --build

elif [ -d /run/systemd/system ]; then
  echo ">> systemd available - deploying as services"
  cd backend
  python3 -m venv .venv
  ./.venv/bin/pip install -q -r requirements.txt
  REPO_BACKEND=$(pwd)
  for svc in tutor-api tutor-scheduler; do
    sudo sed "s|/opt/proactive-tutor-agent/backend|$REPO_BACKEND|g" "deploy/$svc.service" \
      | sudo tee "/etc/systemd/system/$svc.service" >/dev/null
  done
  sudo sed -i 's/--host 127.0.0.1/--host 0.0.0.0/' /etc/systemd/system/tutor-api.service
  sudo systemctl daemon-reload
  sudo systemctl enable --now tutor-api tutor-scheduler
  cd ..

else
  echo ">> No Docker, no systemd - deploying with supervisord (userspace)"
  cd backend
  python3 -m venv .venv
  ./.venv/bin/pip install -q -r requirements.txt supervisor
  B=$(pwd)
  cat > supervisord.conf <<CONF
[supervisord]
logfile=$B/supervisord.log
pidfile=$B/supervisord.pid

[unix_http_server]
file=$B/supervisor.sock

[rpcinterface:supervisor]
supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface

[supervisorctl]
serverurl=unix://$B/supervisor.sock

[program:tutor-api]
command=$B/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
directory=$B
autorestart=true
redirect_stderr=true
stdout_logfile=$B/api.log

[program:tutor-scheduler]
command=$B/.venv/bin/python -m app.scheduler
directory=$B
autorestart=true
redirect_stderr=true
stdout_logfile=$B/scheduler.log
CONF
  if [ -S "$B/supervisor.sock" ] && ./.venv/bin/supervisorctl -c supervisord.conf status >/dev/null 2>&1; then
    ./.venv/bin/supervisorctl -c supervisord.conf reread
    ./.venv/bin/supervisorctl -c supervisord.conf update
    ./.venv/bin/supervisorctl -c supervisord.conf restart all
  else
    ./.venv/bin/supervisord -c supervisord.conf
  fi
  cd ..
fi

echo ">> Waiting for the API..."
for i in $(seq 1 15); do
  if curl -sf localhost:8000/health >/dev/null; then break; fi
  sleep 2
done

curl -sf -X POST localhost:8000/seed && echo || { echo '!! API not responding - check backend/api.log'; exit 1; }
echo ">> Deployed. Smoke test:"
echo ">>   curl -X POST 'localhost:8000/question?student_id=1'"
