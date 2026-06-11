"""The bridge between domains: enroll, pause, set exam dates."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Enrollment, Program
from ..schemas import EnrollmentCreate, EnrollmentUpdate, EnrollmentOut

router = APIRouter(prefix="/enrollments", tags=["enrollments"])


def _out(db: Session, enr: Enrollment) -> EnrollmentOut:
    item = EnrollmentOut.model_validate(enr)
    prog = db.get(Program, enr.program_id)
    item.program_title = prog.title if prog else ""
    return item


@router.get("", response_model=list[EnrollmentOut])
def list_enrollments(user_id: int, db: Session = Depends(get_db)):
    rows = db.execute(
        select(Enrollment).where(Enrollment.user_id == user_id).order_by(Enrollment.id)
    ).scalars().all()
    return [_out(db, e) for e in rows]


@router.post("", response_model=EnrollmentOut)
def enroll(body: EnrollmentCreate, db: Session = Depends(get_db)):
    prog = db.get(Program, body.program_id)
    if not prog:
        raise HTTPException(404, "Unknown program")
    if prog.owner_id is not None and prog.owner_id != body.user_id:
        raise HTTPException(403, "This program belongs to another user")
    existing = db.execute(
        select(Enrollment).where(
            Enrollment.user_id == body.user_id,
            Enrollment.program_id == body.program_id,
        )
    ).scalars().first()
    if existing:
        existing.status = "active"
        if body.exam_date:
            existing.exam_date = body.exam_date
        db.commit()
        return _out(db, existing)
    enr = Enrollment(**body.model_dump())
    db.add(enr)
    db.commit()
    return _out(db, enr)


@router.patch("/{enrollment_id}", response_model=EnrollmentOut)
def update_enrollment(enrollment_id: int, body: EnrollmentUpdate,
                      db: Session = Depends(get_db)):
    enr = db.get(Enrollment, enrollment_id)
    if not enr:
        raise HTTPException(404, "Unknown enrollment")
    if body.status is not None:
        enr.status = body.status
    if body.exam_date is not None:
        enr.exam_date = body.exam_date
    if body.clear_exam_date:
        enr.exam_date = None
    db.commit()
    return _out(db, enr)


@router.delete("/{enrollment_id}")
def unenroll(enrollment_id: int, db: Session = Depends(get_db)):
    enr = db.get(Enrollment, enrollment_id)
    if not enr:
        raise HTTPException(404, "Unknown enrollment")
    db.delete(enr)  # cascades skill states; attempts keep history
    db.commit()
    return {"ok": True}
