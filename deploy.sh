#!/usr/bin/env bash
# One-shot VPS deploy. From the repo root:   bash deploy.sh
# Auto-detects: Docker available -> compose; otherwise -> venv + systemd.
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
else
  echo ">> Docker unavailable (container without nesting?) - deploying with systemd"
  cd backend
  python3 -m venv .venv
  ./.venv/bin/pip install -q -r requirements.txt
  REPO_BACKEND=$(pwd)
  for svc in tutor-api tutor-scheduler; do
    sudo sed "s|/opt/proactive-tutor-agent/backend|$REPO_BACKEND|g" "deploy/$svc.service" \
      | sudo tee "/etc/systemd/system/$svc.service" >/dev/null
  done
  # expose the API beyond localhost so the mobile app can reach it
  sudo sed -i 's/--host 127.0.0.1/--host 0.0.0.0/' /etc/systemd/system/tutor-api.service
  sudo systemctl daemon-reload
  sudo systemctl enable --now tutor-api tutor-scheduler
  cd ..
fi

echo ">> Waiting for the API..."
for i in $(seq 1 15); do
  if curl -sf localhost:8000/health >/dev/null; then break; fi
  sleep 2
done

curl -sf -X POST localhost:8000/seed && echo || { echo '!! API not responding - check logs'; exit 1; }
echo ">> Deployed. Smoke test:"
echo ">>   curl -X POST 'localhost:8000/question?student_id=1'"
