#!/usr/bin/env bash
# Option A - deploy INSIDE a bare container (no Docker, no systemd available).
# The whole backend is ONE process (the FastAPI API; reminders fire on the
# device), so a venv and nohup are all that's needed. Idempotent: re-run after
# every `git pull`.
#
#   bash deploy/container.sh start    # install deps if needed, (re)start
#   bash deploy/container.sh stop
#   bash deploy/container.sh status
#   bash deploy/container.sh logs
set -euo pipefail
cd "$(dirname "$0")/../backend"

PIDFILE=tutor.pid
LOGFILE=tutor.log
PORT="${PORT:-8000}"

ensure_env() {
  if [ ! -f .env ]; then
    cp .env.example .env
    echo "!! Created backend/.env from the example."
    echo "!! Edit it now (set LLM_API_KEY and API_KEY), then re-run: bash deploy/container.sh start"
    exit 1
  fi
  if [ ! -d .venv ]; then python3 -m venv .venv; fi
  ./.venv/bin/pip install -q -r requirements.txt
}

is_running() {
  [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null
}

case "${1:-start}" in
  start)
    ensure_env
    if is_running; then
      echo ">> Stopping old process $(cat "$PIDFILE")"
      kill "$(cat "$PIDFILE")" && sleep 2
    fi
    nohup ./.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port "$PORT" \
      >> "$LOGFILE" 2>&1 &
    echo $! > "$PIDFILE"
    sleep 3
    if curl -fsS "http://localhost:$PORT/health" >/dev/null; then
      echo ">> Running (pid $(cat "$PIDFILE")) - http://localhost:$PORT  | logs: backend/$LOGFILE"
    else
      echo "!! Failed to start. Last log lines:"; tail -n 30 "$LOGFILE"; exit 1
    fi
    ;;
  stop)
    if is_running; then kill "$(cat "$PIDFILE")" && rm -f "$PIDFILE" && echo ">> Stopped."
    else echo ">> Not running."; fi
    ;;
  status)
    if is_running; then echo ">> Running (pid $(cat "$PIDFILE"))"; curl -fsS "http://localhost:$PORT/health" && echo
    else echo ">> Not running."; fi
    ;;
  logs)
    tail -n 100 -f "$LOGFILE"
    ;;
  *)
    echo "usage: bash deploy/container.sh {start|stop|status|logs}"; exit 1
    ;;
esac
