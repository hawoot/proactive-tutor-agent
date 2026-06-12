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
        assert c.patch(f"/skills/{s['id']}?user_id=1", json={"effort": "deep"},
                       headers=H).json()["effort"] == "deep"
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
        assert "round_robin" in c.get("/policies", headers=H).json()["selection_strategy"]["options"]
        enr2 = c.post("/enrollments", json={"user_id": 1, "program_id": p["id"]}, headers=H).json()
        r = c.patch(f"/enrollments/{enr2['id']}", json={
            "selection_strategy": "due_then_unseen", "marking_strictness": "lenient",
            "question_style": "plain", "repeat_cooldown_hours": 2}, headers=H)
        assert r.json()["selection_strategy"] == "due_then_unseen"
        assert c.patch(f"/enrollments/{enr2['id']}", json={
            "selection_strategy": "wild_west"}, headers=H).status_code == 422
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
        assert c.post("/practice/chat", json={"user_id": 1, "text": "more?",
                                              "attempt_id": q["id"]}, headers=H).status_code == 400

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

        # scheduler tick: queues via the outbox, dispatcher delivers, reschedules
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
            logs = db.execute(select(NotificationLog)).scalars().all()
            assert logs and all(n.status == "sent" and n.delivered_at for n in logs)
            assert all(u.next_decision_at for u in db.execute(select(User)).scalars())

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
