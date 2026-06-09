"""
The HTTP API. Every transport (mobile app, Telegram webhook, curl) hits these
endpoints - the backend is channel-blind. Run:  uvicorn app.main:app --reload
"""
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select
from .db import (
    SessionLocal, init_db, Student, Program, Skill, Enrollment, Mastery, Interaction,
)
from . import agent

app = FastAPI(title="Proactive Tutor Agent")
app.add_middleware(  # lets the Expo dev app call the API during development
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)


@app.on_event("startup")
def _startup():
    init_db()


@app.get("/health")
def health():
    return {"ok": True, "ts": datetime.utcnow().isoformat()}


class Message(BaseModel):
    student_id: int
    text: str


@app.post("/message")
def message(m: Message):
    """A learner replied (their answer to the open question). Channel-agnostic."""
    return {"feedback": agent.handle_answer(m.student_id, m.text)}


@app.post("/question")
def question(student_id: int):
    """Pull a question on demand (the proactive path does this on a schedule)."""
    with SessionLocal() as db:
        student = db.get(Student, student_id)
        enr = db.execute(
            select(Enrollment).where(Enrollment.student_id == student_id)
        ).scalars().first()
        if not (student and enr):
            return {"error": "unknown student or no enrollment"}
        picked = agent.pick_skill(db, enr)
        if not picked:
            return {"error": "no skills enrolled"}
        skill, _ = picked
        q = agent.generate_question(student, skill)
        db.add(Interaction(student_id=student_id, skill_id=skill.id, question=q))
        db.commit()
        return {"question": q, "skill": skill.name}


@app.get("/open_question")
def open_question(student_id: int):
    """The mobile app asks: is there an unanswered question waiting for me?"""
    with SessionLocal() as db:
        last = db.execute(
            select(Interaction)
            .where(Interaction.student_id == student_id, Interaction.verdict == "")
            .order_by(Interaction.ts.desc())
        ).scalars().first()
        return {"question": last.question if last else None}


class Device(BaseModel):
    student_id: int
    expo_push_token: str


@app.post("/register_device")
def register_device(d: Device):
    """The mobile app sends its Expo push token; nudges then arrive as push."""
    with SessionLocal() as db:
        student = db.get(Student, d.student_id)
        if not student:
            return {"error": "unknown student"}
        student.channel, student.channel_ref = "push", d.expo_push_token
        db.commit()
        return {"ok": True}


@app.get("/progress")
def progress(student_id: int):
    """Per-skill mastery - the app's progress screen."""
    with SessionLocal() as db:
        rows = db.execute(
            select(Skill.name, Mastery.score, Mastery.attempts)
            .join(Mastery, Mastery.skill_id == Skill.id)
            .join(Enrollment, Enrollment.id == Mastery.enrollment_id)
            .where(Enrollment.student_id == student_id)
        ).all()
        return {"skills": [
            {"name": n, "mastery": round(s, 2), "attempts": a} for n, s, a in rows
        ]}


@app.post("/seed")
def seed():
    """One-shot demo seed: an A-level maths program + a student, ready to use."""
    with SessionLocal() as db:
        if db.execute(select(Program)).scalars().first():
            return {"note": "already seeded", "student_id": 1}
        prog = Program(subject="maths", level="A-level", region="UK")
        db.add(prog); db.flush()
        skills = [
            Skill(program_id=prog.id, name="Integration by parts", question_type="symbolic", effort="deep"),
            Skill(program_id=prog.id, name="Differentiation rules", question_type="symbolic", effort="quick"),
            Skill(program_id=prog.id, name="Binomial expansion", question_type="numeric", effort="quick"),
        ]
        db.add_all(skills); db.flush()
        me = Student(channel="console", channel_ref="you")
        db.add(me); db.flush()
        enr = Enrollment(student_id=me.id, program_id=prog.id)
        db.add(enr); db.flush()
        for s in skills:
            db.add(Mastery(enrollment_id=enr.id, skill_id=s.id))
        db.commit()
        return {"student_id": me.id, "program": "A-level maths", "skills": len(skills)}
