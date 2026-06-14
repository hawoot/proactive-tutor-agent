"""Load the Quant Developer Prep curriculum into a RUNNING backend over the API.

Idempotent: if a program with the same title already exists, it does nothing.
Use this for an already-seeded database (seed() only runs on an empty DB).

    BACKEND_URL=https://your-host API_KEY=... USER_ID=1 \
        python scripts/load_quant_dev.py [--no-enroll]

Stdlib only; imports the curriculum data file directly (no app package import)."""
import importlib.util
import json
import os
import pathlib
import sys
import urllib.error
import urllib.request

BASE = os.environ.get("BACKEND_URL", "").rstrip("/")
KEY = os.environ.get("API_KEY", "")
UID = int(os.environ.get("USER_ID", "1"))
ENROLL = "--no-enroll" not in sys.argv

if not BASE:
    sys.exit("Set BACKEND_URL (and API_KEY).")

# Load the pure-data curriculum module without importing the app package.
_path = pathlib.Path(__file__).resolve().parent.parent / "app" / "curricula" / "quant_dev.py"
_spec = importlib.util.spec_from_file_location("quant_dev", _path)
quant_dev = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(quant_dev)


def api(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        BASE + path, data=data, method=method,
        headers={"content-type": "application/json", **({"X-API-Key": KEY} if KEY else {})})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{method} {path} -> {e.code}: {e.read().decode()[:300]}")


def main():
    progs = api("GET", f"/programs?user_id={UID}")
    existing = next((p for p in progs if p["title"] == quant_dev.PROGRAM["title"]), None)
    if existing:
        print(f"Already loaded: program {existing['id']} '{existing['title']}'. Nothing to do.")
        return

    prog = api("POST", "/programs", {**quant_dev.PROGRAM, "owner_id": None})  # shared library
    pid = prog["id"]
    n_skills = n_q = 0
    for upos, unit in enumerate(quant_dev.TREE):
        u = api("POST", f"/units?user_id={UID}",
                {"program_id": pid, "title": unit["title"],
                 "content": unit.get("content", ""), "position": upos})
        for spos, sk in enumerate(unit.get("skills", [])):
            skill = api("POST", f"/skills?user_id={UID}",
                        {"program_id": pid, "unit_id": u["id"], "position": spos, **sk})
            n_skills += 1
            for qpos, q in enumerate(quant_dev.QUESTIONS.get(sk["name"], [])):
                api("POST", f"/questions?user_id={UID}",
                    {"skill_id": skill["id"], "position": qpos, "source": "curated", **q})
                n_q += 1

    print(f"Created program {pid} '{prog['title']}': "
          f"{len(quant_dev.TREE)} units, {n_skills} skills, {n_q} curated questions.")

    if ENROLL:
        try:
            api("POST", "/enrollments", {"user_id": UID, "program_id": pid})
            print(f"Enrolled user {UID} (so it's practiceable right away).")
        except SystemExit as e:
            print(f"Enroll skipped: {e}")


if __name__ == "__main__":
    main()
