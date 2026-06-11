"""Private annotations a user pins on units/skills - personal enrichment of
shared content without touching the shared rows."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Note
from ..schemas import NoteCreate, NoteUpdate, NoteOut

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=list[NoteOut])
def list_notes(user_id: int, unit_id: int | None = None,
               skill_id: int | None = None, db: Session = Depends(get_db)):
    q = select(Note).where(Note.user_id == user_id)
    if unit_id is not None:
        q = q.where(Note.unit_id == unit_id)
    if skill_id is not None:
        q = q.where(Note.skill_id == skill_id)
    return db.execute(q.order_by(Note.updated_at.desc())).scalars().all()


@router.post("", response_model=NoteOut)
def create_note(body: NoteCreate, db: Session = Depends(get_db)):
    if body.unit_id is None and body.skill_id is None:
        raise HTTPException(400, "Attach the note to a unit_id or a skill_id")
    note = Note(**body.model_dump())
    db.add(note)
    db.commit()
    return note


@router.patch("/{note_id}", response_model=NoteOut)
def update_note(note_id: int, body: NoteUpdate, user_id: int,
                db: Session = Depends(get_db)):
    note = db.get(Note, note_id)
    if not note or note.user_id != user_id:
        raise HTTPException(404, "Unknown note")
    note.body = body.body
    db.commit()
    return note


@router.delete("/{note_id}")
def delete_note(note_id: int, user_id: int, db: Session = Depends(get_db)):
    note = db.get(Note, note_id)
    if not note or note.user_id != user_id:
        raise HTTPException(404, "Unknown note")
    db.delete(note)
    db.commit()
    return {"ok": True}
