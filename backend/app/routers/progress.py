"""Read models: mastery per skill, attempt history, nudge log."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import (
    Attempt, Enrollment, NotificationLog, Program, Skill, SkillState,
)
from ..schemas import AttemptOut

router = APIRouter(tags=["progress"])


@router.get("/progress")
def progress(user_id: int, db: Session = Depends(get_db)):
    """Per-enrollment, per-skill mastery - the Progress screen in one call."""
    enrollments = db.execute(
        select(Enrollment).where(Enrollment.user_id == user_id).order_by(Enrollment.id)
    ).scalars().all()
    out = []
    for enr in enrollments:
        prog = db.get(Program, enr.program_id)
        rows = db.execute(
            select(Skill, SkillState)
            .join(SkillState, SkillState.skill_id == Skill.id)
            .where(SkillState.enrollment_id == enr.id)
            .order_by(Skill.position, Skill.id)
        ).all()
        skills = [{
            "skill_id": s.id,
            "name": s.name,
            "score": round(st.score, 2),
            "attempts": st.attempts,
            "correct": st.correct,
            "due_at": st.due_at.isoformat() if st.due_at else None,
        } for s, st in rows]
        out.append({
            "enrollment_id": enr.id,
            "program_id": enr.program_id,
            "program_title": prog.title if prog else "",
            "status": enr.status,
            "exam_date": enr.exam_date.isoformat() if enr.exam_date else None,
            "skills": skills,
            "avg_score": round(sum(s["score"] for s in skills) / len(skills), 2) if skills else 0,
        })
    return {"enrollments": out}


@router.get("/attempts", response_model=list[AttemptOut])
def attempts(user_id: int, limit: int = 50, db: Session = Depends(get_db)):
    rows = db.execute(
        select(Attempt).where(Attempt.user_id == user_id)
        .order_by(Attempt.asked_at.desc()).limit(min(limit, 200))
    ).scalars().all()
    out = []
    for a in rows:
        item = AttemptOut.model_validate(a)
        item.skill_name = a.skill.name if a.skill else ""
        item.from_bank = a.question_id is not None
        out.append(item)
    return out


@router.get("/notifications")
def notifications(user_id: int, limit: int = 50, db: Session = Depends(get_db)):
    rows = db.execute(
        select(NotificationLog).where(NotificationLog.user_id == user_id)
        .order_by(NotificationLog.sent_at.desc()).limit(min(limit, 200))
    ).scalars().all()
    return {"notifications": [{
        "id": n.id, "channel": n.channel, "body": n.body,
        "status": n.status, "error": n.error, "sent_at": n.sent_at.isoformat(),
    } for n in rows]}
