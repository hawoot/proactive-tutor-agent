"""Pydantic request/response shapes. The API contract, in one place.

Policy toggles are Literal enums: the API physically cannot accept a strategy
name that code doesn't implement - structured switches, not free text."""
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

SelectionStrategy = Literal["due_then_weakest", "due_then_unseen", "round_robin"]
MarkingStrictness = Literal["strict", "balanced", "lenient"]
QuestionStyle = Literal["plain", "latex"]
QuestionSource = Literal["bank_first", "bank_only", "generate_only"]


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- users -----------------------------------------------------------------

class UserCreate(BaseModel):
    name: str = ""
    timezone: str | None = None


class UserUpdate(BaseModel):
    name: str | None = None
    timezone: str | None = None
    quiet_hours_start: int | None = Field(None, ge=0, le=23)
    quiet_hours_end: int | None = Field(None, ge=0, le=23)
    max_prompts_per_day: int | None = Field(None, ge=0, le=48)
    daily_goal: int | None = Field(None, ge=1, le=50)
    profile_note: str | None = None


class UserOut(ORM):
    id: int
    name: str
    timezone: str
    quiet_hours_start: int
    quiet_hours_end: int
    max_prompts_per_day: int
    daily_goal: int
    profile_note: str
    next_decision_at: datetime | None


# --- devices -----------------------------------------------------------------

class DeviceCreate(BaseModel):
    user_id: int
    channel: str = "push"  # push | telegram | console
    channel_ref: str
    label: str = ""


class DeviceOut(ORM):
    id: int
    user_id: int
    channel: str
    channel_ref: str
    label: str
    is_active: bool


# --- content -------------------------------------------------------------------

class ProgramCreate(BaseModel):
    title: str
    subject: str = ""
    level: str = ""
    region: str = ""
    description: str = ""
    owner_id: int | None = None  # None = shared library content


class ProgramUpdate(BaseModel):
    title: str | None = None
    subject: str | None = None
    level: str | None = None
    region: str | None = None
    description: str | None = None
    status: str | None = None


class ProgramOut(ORM):
    id: int
    owner_id: int | None
    title: str
    subject: str
    level: str
    region: str
    description: str
    status: str
    unit_count: int = 0
    skill_count: int = 0
    enrolled: bool = False


class UnitCreate(BaseModel):
    program_id: int
    parent_id: int | None = None
    title: str
    content: str = ""
    position: int = 0


class UnitUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    position: int | None = None
    parent_id: int | None = None


class SkillCreate(BaseModel):
    program_id: int
    unit_id: int | None = None
    name: str
    description: str = ""
    question_type: str = "numeric"
    effort: str = "quick"
    position: int = 0


class SkillUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    question_type: str | None = None
    effort: str | None = None
    position: int | None = None
    unit_id: int | None = None


class SkillOut(ORM):
    id: int
    program_id: int
    unit_id: int | None
    position: int
    name: str
    description: str
    question_type: str
    effort: str
    question_count: int = 0  # curated questions in the bank for this skill


class UnitNode(ORM):
    """A unit with its skills and child units - the tree the Library screen renders."""
    id: int
    program_id: int
    parent_id: int | None
    position: int
    title: str
    content: str
    skills: list[SkillOut] = []
    children: list["UnitNode"] = []


# --- notes ------------------------------------------------------------------------

class NoteCreate(BaseModel):
    user_id: int
    unit_id: int | None = None
    skill_id: int | None = None
    body: str


class NoteUpdate(BaseModel):
    body: str


class NoteOut(ORM):
    id: int
    user_id: int
    unit_id: int | None
    skill_id: int | None
    body: str
    updated_at: datetime


# --- enrollments ---------------------------------------------------------------------

class EnrollmentCreate(BaseModel):
    user_id: int
    program_id: int
    exam_date: datetime | None = None


class EnrollmentUpdate(BaseModel):
    status: Literal["active", "paused", "completed"] | None = None
    exam_date: datetime | None = None
    clear_exam_date: bool = False
    # policy toggles - validated enums + bounded numbers
    selection_strategy: SelectionStrategy | None = None
    repeat_cooldown_hours: float | None = Field(None, ge=0, le=168)
    marking_strictness: MarkingStrictness | None = None
    question_style: QuestionStyle | None = None
    question_source: QuestionSource | None = None


class EnrollmentOut(ORM):
    id: int
    user_id: int
    program_id: int
    status: str
    exam_date: datetime | None
    selection_strategy: str
    repeat_cooldown_hours: float
    marking_strictness: str
    question_style: str
    question_source: str
    program_title: str = ""


# --- practice ----------------------------------------------------------------------------

class QuestionRequest(BaseModel):
    user_id: int
    enrollment_id: int | None = None  # default: pick across all active enrollments
    effort: str | None = None         # quick | deep


class AnswerRequest(BaseModel):
    user_id: int
    text: str
    attempt_id: int | None = None     # default: the latest open attempt


class AttemptOut(ORM):
    id: int
    skill_id: int | None
    source: str
    question: str
    answer: str
    verdict: str
    feedback: str
    asked_at: datetime
    answered_at: datetime | None
    skill_name: str = ""
    from_bank: bool = False  # True = curated bank question; False = LLM-generated


class MessageOut(ORM):
    id: int
    role: str       # tutor | student
    kind: str       # question | chat | answer | feedback
    content: str
    modality: str
    created_at: datetime


class ChatRequest(BaseModel):
    user_id: int
    text: str
    attempt_id: int | None = None              # default: the open attempt
    modality: Literal["text", "voice"] = "text"  # voice = transcribed speech


class ChatResponse(BaseModel):
    attempt: AttemptOut
    messages: list[MessageOut]
    closed: bool  # True once the answer has been marked


# --- question bank ----------------------------------------------------------------

class QuestionCreate(BaseModel):
    skill_id: int
    text: str
    answer: str = ""
    commentary: str = ""
    position: int = 0
    source: str = "curated"


class QuestionUpdate(BaseModel):
    text: str | None = None
    answer: str | None = None
    commentary: str | None = None
    position: int | None = None


class QuestionOut(ORM):
    id: int
    skill_id: int
    position: int
    text: str
    answer: str
    commentary: str
    source: str
