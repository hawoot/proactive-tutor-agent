"""End-to-end smoke test over the whole API with the fake LLM provider.
No network, no API key needed. Run from backend/:

    pip install pytest && python -m pytest tests/ -q
"""
import os
import tempfile

_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["LLM_PROVIDER"] = "fake"
os.environ["SCHEDULER_MODE"] = "off"
os.environ["API_KEY"] = "testkey"

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402

H = {"X-API-Key": "testkey"}


def test_everything():
    with TestClient(app) as c:
        # auth: /health open, everything else key-gated
        assert c.get("/health").status_code == 200
        assert c.get("/programs").status_code == 401

        # seed (idempotent)
        assert c.post("/seed", headers=H).json()["user_id"] == 1
        assert "already seeded" in c.post("/seed", headers=H).json()["note"]

        # library: shared program visible, tree built
        progs = c.get("/programs?user_id=1", headers=H).json()
        assert progs[0]["owner_id"] is None and progs[0]["skill_count"] == 3
        tree = c.get("/programs/1/tree", headers=H).json()
        assert tree[0]["title"] == "Pure Mathematics" and len(tree[0]["children"]) == 2

        # content CRUD on a personal program
        p = c.post("/programs", json={"title": "My Prep", "owner_id": 1}, headers=H).json()
        u = c.post("/units?user_id=1", json={"program_id": p["id"], "title": "Topic"}, headers=H).json()
        s = c.post("/skills?user_id=1", json={
            "program_id": p["id"], "unit_id": u["id"], "name": "Skill A"}, headers=H).json()
        assert c.patch(f"/skills/{s['id']}?user_id=1", json={"effort": "deep"},
                       headers=H).json()["effort"] == "deep"
        # cross-program parent rejected
        assert c.post("/units?user_id=1", json={
            "program_id": p["id"], "parent_id": 1, "title": "bad"}, headers=H).status_code == 400

        # clone shared -> personal (deep copy)
        clone = c.post("/programs/1/clone?user_id=1", headers=H).json()
        ctree = c.get(f"/programs/{clone['id']}/tree", headers=H).json()
        assert len(ctree[0]["children"]) == 2

        # ownership guards
        c.post("/users", json={"name": "Other"}, headers=H)
        assert c.patch(f"/programs/{p['id']}?user_id=2", json={"title": "x"},
                       headers=H).status_code == 403
        assert c.post("/enrollments", json={"user_id": 2, "program_id": p["id"]},
                      headers=H).status_code == 403

        # practice loop (fake LLM): ask -> no stacking -> answer -> mastery moves
        c.post("/enrollments", json={"user_id": 1, "program_id": p["id"]}, headers=H)
        q = c.post("/practice/question", json={"user_id": 1}, headers=H).json()
        assert c.post("/practice/question", json={"user_id": 1}, headers=H).json()["id"] == q["id"]
        a = c.post("/practice/answer", json={"user_id": 1, "text": "4"}, headers=H).json()
        assert a["verdict"] == "correct"
        prog = c.get("/progress?user_id=1", headers=H).json()["enrollments"]
        answered = [s for e in prog for s in e["skills"] if s["attempts"] > 0]
        assert answered and answered[0]["score"] > 0.3

        # notes, devices, prefs
        n = c.post("/notes", json={"user_id": 1, "unit_id": 1, "body": "revise"}, headers=H).json()
        assert c.get("/notes?user_id=1", headers=H).json()[0]["id"] == n["id"]
        d = c.post("/devices", json={"user_id": 1, "channel": "console",
                                     "channel_ref": "dev"}, headers=H).json()
        assert c.post("/devices", json={"user_id": 1, "channel": "console",
                                        "channel_ref": "dev"}, headers=H).json()["id"] == d["id"]
        assert c.patch("/users/1", json={"timezone": "Europe/London"},
                       headers=H).json()["timezone"] == "Europe/London"

        # scheduler tick: nudges + reschedules
        from sqlalchemy import select
        from app import scheduler
        from app.db import SessionLocal
        from app.models import User, NotificationLog
        with SessionLocal() as db:
            for usr in db.execute(select(User)).scalars():
                usr.quiet_hours_start = usr.quiet_hours_end = 0
                usr.next_decision_at = None
            db.commit()
        scheduler.tick()
        with SessionLocal() as db:
            assert db.execute(select(NotificationLog)).scalars().all()
            assert all(u.next_decision_at for u in db.execute(select(User)).scalars())

        # cleanup paths: skip, cascade deletes
        assert c.post("/practice/skip?user_id=1", headers=H).json()["ok"]
        assert c.delete(f"/programs/{p['id']}?user_id=1", headers=H).json()["ok"]
        assert c.delete("/users/2", headers=H).json()["ok"]
