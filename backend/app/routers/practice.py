"""The learning loop: get a question, answer it, get marked."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import agent
from ..db import get_db
from ..models import Attempt, Enrollment
from ..schemas import (
    QuestionRequest, AnswerRequest, AttemptOut, ChatRequest, ChatResponse, MessageOut,
)
from .users import get_user_or_404

router = APIRouter(prefix="/practice", tags=["practice"])


def _out(attempt: Attempt) -> AttemptOut:
    item = AttemptOut.model_validate(attempt)
    item.skill_name = attempt.skill.name if attempt.skill else ""
    item.program_title = attempt.skill.program.title if attempt.skill and attempt.skill.program else ""
    item.from_bank = attempt.question_id is not None
    return item


@router.get("/open", response_model=AttemptOut | None)
def open_question(user_id: int, db: Session = Depends(get_db)):
    """Is there an unanswered question waiting? (Scheduled nudges land here.)"""
    attempt = agent.open_attempt(db, user_id)
    return _out(attempt) if attempt else None


@router.post("/question", response_model=AttemptOut)
def new_question(body: QuestionRequest, db: Session = Depends(get_db)):
    """Pull a question on demand (the scheduler does the same thing proactively)."""
    user = get_user_or_404(db, body.user_id)
    existing = agent.open_attempt(db, body.user_id)
    if existing:
        return _out(existing)  # don't stack: answer the open one first
    if body.enrollment_id:
        enr = db.get(Enrollment, body.enrollment_id)
        if not enr or enr.user_id != body.user_id:
            raise HTTPException(404, "Unknown enrollment")
        enrollments = [enr]
    else:
        enrollments = agent.active_enrollments(db, body.user_id)
    if not enrollments:
        raise HTTPException(400, "No active enrollment - enroll in a program first")
    attempt = agent.ask_question(db, user, enrollments, source="on_demand",
                                 mode=body.mode)
    if not attempt:
        raise HTTPException(400, (
            "No question available: either the program(s) have no skills yet, "
            "or the policy is bank_only and the question bank is empty for the "
            "chosen skill - add questions or switch question_source."))
    db.commit()
    return _out(attempt)


@router.post("/answer", response_model=AttemptOut)
def answer(body: AnswerRequest, db: Session = Depends(get_db)):
    get_user_or_404(db, body.user_id)
    if body.attempt_id:
        attempt = db.get(Attempt, body.attempt_id)
        if not attempt or attempt.user_id != body.user_id:
            raise HTTPException(404, "Unknown attempt")
        if attempt.verdict:
            raise HTTPException(400, "Attempt already answered")
    else:
        attempt = agent.open_attempt(db, body.user_id)
        if not attempt:
            raise HTTPException(400, "No open question - ask for one first")
    agent.handle_answer(db, attempt, body.text)
    db.commit()
    return _out(attempt)


def _resolve_attempt(db: Session, user_id: int, attempt_id: int | None) -> Attempt:
    if attempt_id:
        attempt = db.get(Attempt, attempt_id)
        if not attempt or attempt.user_id != user_id:
            raise HTTPException(404, "Unknown attempt")
        return attempt
    attempt = agent.open_attempt(db, user_id)
    if not attempt:
        raise HTTPException(400, "No open question - ask for one first")
    return attempt


def _chat_response(db: Session, attempt: Attempt) -> ChatResponse:
    agent.ensure_question_message(db, attempt)
    return ChatResponse(
        attempt=_out(attempt),
        messages=[MessageOut.model_validate(m) for m in attempt.messages],
        closed=bool(attempt.verdict),
    )


@router.get("/messages", response_model=ChatResponse)
def messages(user_id: int, attempt_id: int | None = None,
             db: Session = Depends(get_db)):
    """The conversation about a question (default: the open one)."""
    get_user_or_404(db, user_id)
    attempt = _resolve_attempt(db, user_id, attempt_id)
    resp = _chat_response(db, attempt)
    db.commit()
    return resp


@router.post("/chat", response_model=ChatResponse)
def chat(body: ChatRequest, db: Session = Depends(get_db)):
    """Talk to the tutor about the open question. Final answers get marked
    and close the attempt; everything else gets Socratic coaching."""
    user = get_user_or_404(db, body.user_id)
    attempt = _resolve_attempt(db, body.user_id, body.attempt_id)
    if not body.text.strip() and not body.images:
        raise HTTPException(400, "Empty message")
    if attempt.verdict:
        # marked already - keep talking: clarify, drill down, no re-marking
        agent.followup_turn(db, user, attempt, body.text.strip(), modality=body.modality)
    else:
        agent.chat_turn(db, user, attempt, body.text.strip(),
                        modality=body.modality, images=body.images)
    resp = _chat_response(db, attempt)
    db.commit()
    return resp


@router.post("/skip")
def skip(user_id: int, db: Session = Depends(get_db)):
    """Dismiss the open question without affecting mastery."""
    attempt = agent.open_attempt(db, user_id)
    if not attempt:
        return {"ok": True, "note": "nothing open"}
    attempt.verdict = "skipped"
    db.commit()
    return {"ok": True}
