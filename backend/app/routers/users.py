"""Learner identity + scheduling preferences (personal domain)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete as sa_delete
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User, NudgeTime
from ..schemas import (
    UserCreate, UserUpdate, UserOut, ScheduleIn, NudgeTimeOut,
)

router = APIRouter(prefix="/users", tags=["users"])


def get_user_or_404(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, f"Unknown user {user_id}")
    return user


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.execute(select(User).order_by(User.id)).scalars().all()


@router.post("", response_model=UserOut)
def create_user(body: UserCreate, db: Session = Depends(get_db)):
    user = User(name=body.name)
    if body.timezone:
        user.timezone = body.timezone
    db.add(user)
    db.commit()
    return user


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    return get_user_or_404(db, user_id)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, body: UserUpdate, db: Session = Depends(get_db)):
    user = get_user_or_404(db, user_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    return user


@router.get("/{user_id}/schedule", response_model=list[NudgeTimeOut])
def get_schedule(user_id: int, db: Session = Depends(get_db)):
    """The exact clock times the user chose to be nudged at."""
    get_user_or_404(db, user_id)
    return db.execute(
        select(NudgeTime).where(NudgeTime.user_id == user_id)
        .order_by(NudgeTime.weekday, NudgeTime.hour, NudgeTime.minute)
    ).scalars().all()


@router.put("/{user_id}/schedule", response_model=list[NudgeTimeOut])
def put_schedule(user_id: int, body: ScheduleIn, db: Session = Depends(get_db)):
    """Replace the whole set of nudge times in one call (stored for persistence;
    the device schedules the actual notifications). Empty list = no reminders."""
    get_user_or_404(db, user_id)
    db.execute(sa_delete(NudgeTime).where(NudgeTime.user_id == user_id))
    for t in body.times:
        db.add(NudgeTime(user_id=user_id, **t.model_dump()))
    db.commit()
    return db.execute(
        select(NudgeTime).where(NudgeTime.user_id == user_id)
        .order_by(NudgeTime.weekday, NudgeTime.hour, NudgeTime.minute)
    ).scalars().all()


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = get_user_or_404(db, user_id)
    db.delete(user)  # cascades to devices, enrollments, states, attempts, notes
    db.commit()
    return {"ok": True}
