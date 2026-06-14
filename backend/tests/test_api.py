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

        # library: shared program visible, full curriculum tree built
        progs = c.get("/programs?user_id=1", headers=H).json()
        assert progs[0]["owner_id"] is None and progs[0]["skill_count"] > 40
        tree = c.get("/programs/1/tree", headers=H).json()
        assert [t["title"] for t in tree] == ["Pure Mathematics", "Statistics", "Mechanics"]
        assert len(tree[0]["children"]) >= 8  # Pure topic units

        # content CRUD on a personal program
        p = c.post("/programs", json={"title": "My Prep", "owner_id": 1}, headers=H).json()
        u = c.post("/units?user_id=1", json={"program_id": p["id"], "title": "Topic"}, headers=H).json()
        s = c.post("/skills?user_id=1", json={
            "program_id": p["id"], "unit_id": u["id"], "name": "Skill A"}, headers=H).json()
        assert c.patch(f"/skills/{s['id']}?user_id=1", json={"kind": "code"},
                       headers=H).json()["kind"] == "code"
        # cross-program parent rejected
        assert c.post("/units?user_id=1", json={
            "program_id": p["id"], "parent_id": 1, "title": "bad"}, headers=H).status_code == 400

        # clone shared -> personal (deep copy)
        clone = c.post("/programs/1/clone?user_id=1", headers=H).json()
        ctree = c.get(f"/programs/{clone['id']}/tree", headers=H).json()
        assert len(ctree[0]["children"]) == len(tree[0]["children"])  # full deep copy

        # ownership guards
        c.post("/users", json={"name": "Other"}, headers=H)
        assert c.patch(f"/programs/{p['id']}?user_id=2", json={"title": "x"},
                       headers=H).status_code == 403
        assert c.post("/enrollments", json={"user_id": 2, "program_id": p["id"]},
                      headers=H).status_code == 403

        # policy toggles: structured enums - valid values stick, junk is rejected
        assert "on_the_go" in c.get("/policies", headers=H).json()["mode"]["options"]
        enr2 = c.post("/enrollments", json={"user_id": 1, "program_id": p["id"]}, headers=H).json()
        r = c.patch(f"/enrollments/{enr2['id']}", json={
            "marking_strictness": "lenient",
            "question_style": "plain", "repeat_cooldown_hours": 2}, headers=H)
        assert r.json()["marking_strictness"] == "lenient"
        assert c.patch(f"/enrollments/{enr2['id']}", json={
            "marking_strictness": "wild_west"}, headers=H).status_code == 422
        assert c.patch(f"/enrollments/{enr2['id']}", json={
            "repeat_cooldown_hours": 999}, headers=H).status_code == 422

        # question bank: CRUD, then bank-first serving with canonical marking
        qb = c.post("/questions?user_id=1", json={
            "skill_id": s["id"], "text": "What is 1 + 1?", "answer": "2",
            "commentary": "binary"}, headers=H).json()
        assert c.get(f"/skills/{s['id']}/questions", headers=H).json()[0]["answer"] == "2"
        assert c.patch(f"/questions/{qb['id']}?user_id=1", json={"answer": "two"},
                       headers=H).json()["answer"] == "two"

        # practice loop: bank_first serves the curated question (no stacking),
        # fake-LLM marking closes it and mastery moves
        q = c.post("/practice/question", json={"user_id": 1, "enrollment_id": enr2["id"]},
                   headers=H).json()
        assert q["from_bank"] and q["question"] == "What is 1 + 1?"
        assert c.post("/practice/question", json={"user_id": 1}, headers=H).json()["id"] == q["id"]
        a = c.post("/practice/answer", json={"user_id": 1, "text": "2"}, headers=H).json()
        assert a["verdict"] == "correct"

        # mini-conversation: coaching keeps the attempt open, a real answer closes it
        q = c.post("/practice/question", json={"user_id": 1, "enrollment_id": enr2["id"]},
                   headers=H).json()
        r = c.post("/practice/chat", json={"user_id": 1, "text": "I'm stuck, any hint?"},
                   headers=H).json()
        assert not r["closed"] and r["messages"][-1]["role"] == "tutor"
        assert r["messages"][0]["kind"] == "question"
        r = c.post("/practice/chat", json={"user_id": 1, "text": "ok my answer is 2",
                                           "modality": "voice"}, headers=H).json()
        assert r["closed"] and r["attempt"]["verdict"] == "correct"
        assert r["messages"][-1]["kind"] == "feedback"
        hist = c.get("/practice/messages?user_id=1&attempt_id=" + str(q["id"]), headers=H).json()
        assert len(hist["messages"]) >= 4
        # after marking, the conversation continues as follow-up (no re-marking)
        r = c.post("/practice/chat", json={"user_id": 1, "text": "why is that right?",
                                           "attempt_id": q["id"]}, headers=H).json()
        assert r["closed"] and r["messages"][-1]["role"] == "tutor"
        assert "follow" in r["messages"][-1]["content"].lower()
        assert r["attempt"]["verdict"] == "correct"  # unchanged

        # schedule: pick exact clock times, fetch them back, junk rejected
        ts = [{"weekday": d, "hour": 9, "minute": 0} for d in range(7)] + \
             [{"weekday": d, "hour": 18, "minute": 30} for d in range(7)]
        assert len(c.put("/users/1/schedule", json={"times": ts}, headers=H).json()) == 14
        assert len(c.get("/users/1/schedule", headers=H).json()) == 14
        assert c.put("/users/1/schedule", json={"times": [
            {"weekday": 9, "hour": 9, "minute": 0}]}, headers=H).status_code == 422
        assert c.put("/users/1/schedule", json={"times": [
            {"weekday": 1, "hour": 25, "minute": 0}]}, headers=H).status_code == 422
        # leave a valid all-day schedule so the scheduler has slots to fire on
        c.put("/users/1/schedule", json={"times": [
            {"weekday": d, "hour": 9, "minute": 0} for d in range(7)]}, headers=H)

        # generate_only flips back to creative questions (reasoning stripped by the parser)
        c.patch(f"/enrollments/{enr2['id']}", json={"question_source": "generate_only"}, headers=H)
        q2 = c.post("/practice/question", json={"user_id": 1, "enrollment_id": enr2["id"]},
                    headers=H).json()
        assert not q2["from_bank"] and q2["question"] == "(fake provider) What is 2 + 2?"
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

        # next reminder: server only COMPUTES the next fire time (the device
        # schedules and fires the actual notifications). With an all-day
        # schedule set above, the next reminder must be in the future.
        from datetime import datetime
        from app import scheduler
        from app.db import SessionLocal
        from app.models import User
        with SessionLocal() as db:
            u = db.get(User, 1)
            nxt = scheduler.next_nudge_at(db, u, datetime.utcnow())
            assert nxt is not None and nxt > datetime.utcnow()
            # a user with no times set gets no reminder
            from app.models import NudgeTime
            from sqlalchemy import delete as sa_delete
            db.execute(sa_delete(NudgeTime).where(NudgeTime.user_id == 2))
            db.commit()
            u2 = db.get(User, 2)
            assert u2 is None or scheduler.next_nudge_at(db, u2, datetime.utcnow()) is None

        # repeat cooldown: a just-seen, not-yet-due skill is excluded for the
        # scheduler but still served on demand
        from app import agent as agent_mod
        from app.models import Enrollment as EnrModel
        with SessionLocal() as db:
            enr_row = db.get(EnrModel, 1)  # seeded enrollment, one skill just answered
            usr = db.get(User, 1)
            scheduled = agent_mod.pick_skill(db, [enr_row], respect_cooldown=True)
            on_demand = agent_mod.pick_skill(db, [enr_row], respect_cooldown=False)
            assert on_demand is not None
            if scheduled:  # if anything survives cooldown it must not be the just-seen skill
                assert scheduled[1].last_seen_at is None

        # /today aggregate: streak, goal, schedule visibility
        t = c.get("/today?user_id=1", headers=H).json()
        assert t["streak_days"] >= 1 and t["answered_today"] >= 2
        assert t["daily_goal"] == 3 and t["has_active_enrollment"]
        assert t["recent"] and t["recent"][0]["verdict"] == "correct"
        assert c.patch("/users/1", json={"daily_goal": 5},
                       headers=H).json()["daily_goal"] == 5

        # cleanup paths: skip, cascade deletes
        assert c.post("/practice/skip?user_id=1", headers=H).json()["ok"]
        assert c.delete(f"/programs/{p['id']}?user_id=1", headers=H).json()["ok"]
        assert c.delete("/users/2", headers=H).json()["ok"]
