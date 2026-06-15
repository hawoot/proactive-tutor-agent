"""End-to-end smoke test over the whole API with the fake LLM provider.
No network, no API key needed, and crucially NO seeded curriculum: content is
created through the API, which is the ONLY way content is managed (see
docs/DATA.md). Run from backend/:  python -m pytest tests/ -q
"""
import os
import tempfile
from datetime import datetime

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
        # --- auth: /health is open, everything else is key-gated ---
        assert c.get("/health").status_code == 200
        assert c.get("/programs").status_code == 401

        # --- seed bootstraps ONE user and bakes in NO curriculum content ---
        assert c.post("/seed", headers=H).json()["user_id"] == 1
        assert "already seeded" in c.post("/seed", headers=H).json()["note"]
        assert c.get("/programs?user_id=1", headers=H).json() == []  # nothing baked into code

        # --- content is authored through the API: program -> unit -> skills -> question ---
        prog = c.post("/programs", json={"title": "Demo course", "owner_id": None}, headers=H).json()
        assert prog["owner_id"] is None
        unit = c.post("/units?user_id=1", json={"program_id": prog["id"], "title": "Topic 1"}, headers=H).json()
        sa = c.post("/skills?user_id=1", json={
            "program_id": prog["id"], "unit_id": unit["id"], "name": "Adding", "kind": "math"}, headers=H).json()
        c.post("/skills?user_id=1", json={
            "program_id": prog["id"], "unit_id": unit["id"], "name": "Doubling", "kind": "math"}, headers=H)
        assert sa["kind"] == "math"
        assert c.patch(f"/skills/{sa['id']}?user_id=1", json={"kind": "code"},
                       headers=H).json()["kind"] == "code"

        # curated question with mode/style, then edit it
        q = c.post("/questions?user_id=1", json={
            "skill_id": sa["id"], "text": "What is 1 + 1?", "answer": "2",
            "commentary": "binary", "mode": "short_drill"}, headers=H).json()
        assert q["mode"] == "short_drill"
        assert c.get(f"/skills/{sa['id']}/questions", headers=H).json()[0]["answer"] == "2"
        assert c.patch(f"/questions/{q['id']}?user_id=1", json={"answer": "two"},
                       headers=H).json()["answer"] == "two"
        c.patch(f"/questions/{q['id']}?user_id=1", json={"answer": "2"}, headers=H)  # restore

        # cross-program parent rejected
        other = c.post("/programs", json={"title": "Other", "owner_id": 1}, headers=H).json()
        ounit = c.post("/units?user_id=1", json={"program_id": other["id"], "title": "x"}, headers=H).json()
        assert c.post("/units?user_id=1", json={
            "program_id": prog["id"], "parent_id": ounit["id"], "title": "bad"}, headers=H).status_code == 400

        # clone (deep copy) the shared program into the user's space
        clone = c.post(f"/programs/{prog['id']}/clone?user_id=1", headers=H).json()
        ctree = c.get(f"/programs/{clone['id']}/tree", headers=H).json()
        assert ctree[0]["title"] == "Topic 1" and len(ctree[0]["skills"]) == 2

        # --- ownership guards ---
        c.post("/users", json={"name": "Other"}, headers=H)  # user 2
        assert c.patch(f"/programs/{other['id']}?user_id=2", json={"title": "x"},
                       headers=H).status_code == 403
        assert c.post("/enrollments", json={"user_id": 2, "program_id": other["id"]},
                      headers=H).status_code == 403

        # --- policies: mode options exposed; enrollment toggles validated ---
        assert "on_the_go" in c.get("/policies", headers=H).json()["mode"]["options"]
        enr = c.post("/enrollments", json={"user_id": 1, "program_id": prog["id"]}, headers=H).json()
        r = c.patch(f"/enrollments/{enr['id']}", json={
            "marking_strictness": "lenient", "repeat_cooldown_hours": 2}, headers=H)
        assert r.json()["marking_strictness"] == "lenient"
        assert c.patch(f"/enrollments/{enr['id']}", json={
            "marking_strictness": "nope"}, headers=H).status_code == 422
        assert c.patch(f"/enrollments/{enr['id']}", json={
            "repeat_cooldown_hours": 999}, headers=H).status_code == 422

        # --- practice: curated-only serves the bank question; fake marking closes it ---
        c.patch(f"/enrollments/{enr['id']}", json={"question_source": "bank_only"}, headers=H)
        q1 = c.post("/practice/question", json={"user_id": 1, "enrollment_id": enr["id"]},
                    headers=H).json()
        assert q1["from_bank"] and q1["question"] == "What is 1 + 1?"
        assert c.post("/practice/question", json={"user_id": 1}, headers=H).json()["id"] == q1["id"]
        a = c.post("/practice/answer", json={"user_id": 1, "text": "2"}, headers=H).json()
        assert a["verdict"] == "correct"

        # mini-conversation: coaching keeps it open, a real answer closes it
        q2 = c.post("/practice/question", json={"user_id": 1, "enrollment_id": enr["id"]},
                    headers=H).json()
        r = c.post("/practice/chat", json={"user_id": 1, "text": "I'm stuck, any hint?"},
                   headers=H).json()
        assert not r["closed"] and r["messages"][-1]["role"] == "tutor"
        assert r["messages"][0]["kind"] == "question"
        r = c.post("/practice/chat", json={"user_id": 1, "text": "ok my answer is 2",
                                           "modality": "voice"}, headers=H).json()
        assert r["closed"] and r["attempt"]["verdict"] == "correct"
        assert r["messages"][-1]["kind"] == "feedback"
        r = c.post("/practice/chat", json={"user_id": 1, "text": "why is that right?",
                                           "attempt_id": q2["id"]}, headers=H).json()
        assert r["closed"] and "follow" in r["messages"][-1]["content"].lower()
        assert r["attempt"]["verdict"] == "correct"  # follow-up doesn't re-mark

        # generate_only flips to creative questions (reasoning stripped by the parser)
        c.patch(f"/enrollments/{enr['id']}", json={"question_source": "generate_only"}, headers=H)
        q3 = c.post("/practice/question", json={"user_id": 1, "enrollment_id": enr["id"]},
                    headers=H).json()
        assert not q3["from_bank"] and q3["question"] == "(fake provider) What is 2 + 2?"
        a = c.post("/practice/answer", json={"user_id": 1, "text": "4"}, headers=H).json()
        assert a["verdict"] == "correct"
        prog_skills = c.get("/progress?user_id=1", headers=H).json()["enrollments"]
        answered = [s for e in prog_skills for s in e["skills"] if s["attempts"] > 0]
        assert answered and answered[0]["score"] > 0.3

        # --- schedule: exact clock times, fetch back, junk rejected ---
        ts = [{"weekday": d, "hour": 9, "minute": 0} for d in range(7)] + \
             [{"weekday": d, "hour": 18, "minute": 30} for d in range(7)]
        assert len(c.put("/users/1/schedule", json={"times": ts}, headers=H).json()) == 14
        assert len(c.get("/users/1/schedule", headers=H).json()) == 14
        assert c.put("/users/1/schedule", json={"times": [
            {"weekday": 9, "hour": 9, "minute": 0}]}, headers=H).status_code == 422
        c.put("/users/1/schedule", json={"times": [
            {"weekday": d, "hour": 9, "minute": 0} for d in range(7)]}, headers=H)

        # --- notes, devices, prefs ---
        n = c.post("/notes", json={"user_id": 1, "unit_id": unit["id"], "body": "revise"}, headers=H).json()
        assert c.get("/notes?user_id=1", headers=H).json()[0]["id"] == n["id"]
        d = c.post("/devices", json={"user_id": 1, "channel": "console", "channel_ref": "dev"}, headers=H).json()
        assert c.post("/devices", json={"user_id": 1, "channel": "console",
                                        "channel_ref": "dev"}, headers=H).json()["id"] == d["id"]
        assert c.patch("/users/1", json={"timezone": "Europe/London"},
                       headers=H).json()["timezone"] == "Europe/London"

        # --- server computes the next reminder time from the chosen schedule ---
        from app import scheduler
        from app.db import SessionLocal
        from app.models import User, Enrollment as EnrModel
        with SessionLocal() as db:
            u = db.get(User, 1)
            nxt = scheduler.next_nudge_at(db, u, datetime.utcnow())
            assert nxt is not None and nxt > datetime.utcnow()

        # --- cooldown: a just-seen, not-due skill is held back for the scheduler
        #     but the on-demand path always returns something ---
        from app import agent as agent_mod
        with SessionLocal() as db:
            enr_row = db.get(EnrModel, enr["id"])
            scheduled = agent_mod.pick_skill(db, [enr_row], respect_cooldown=True)
            on_demand = agent_mod.pick_skill(db, [enr_row], respect_cooldown=False)
            assert on_demand is not None
            if scheduled:  # anything surviving the cooldown must not be a just-seen skill
                assert scheduled[1].last_seen_at is None

        # --- /today aggregate ---
        t = c.get("/today?user_id=1", headers=H).json()
        assert t["streak_days"] >= 1 and t["answered_today"] >= 2
        assert t["daily_goal"] == 3 and t["has_active_enrollment"]
        assert t["recent"] and t["recent"][0]["verdict"] in ("correct", "partial", "wrong")
        assert c.patch("/users/1", json={"daily_goal": 5}, headers=H).json()["daily_goal"] == 5

        # --- cleanup paths: skip, cascade deletes ---
        assert c.post("/practice/skip?user_id=1", headers=H).json()["ok"]
        assert c.delete(f"/programs/{prog['id']}?user_id=1", headers=H).json()["ok"]
        assert c.delete("/users/2", headers=H).json()["ok"]
