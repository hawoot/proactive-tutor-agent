"""
The data model - the core asset of the product.

Two clearly segregated domains, linked only through enrollments:

  CONTENT (shareable curriculum library)          PERSONAL (one learner's world)
  ------------------------------------          --------------------------------
  Program   subject+level+region skeleton        User          the learner + prefs
  Unit      recursive material tree              Device        push/telegram endpoints
  Skill     atomic masterable thing              Enrollment    user <-> program + exam date
                                                 SkillState    per-skill adaptive memory
                                                 Attempt       append-only Q/A event log
                                                 Note          private annotation on content
                                                 NotificationLog  every nudge sent

Ownership rule (the whole personal-vs-shared story in one column):
  Program.owner_id IS NULL  -> shared library content, visible to everyone.
  Program.owner_id = user   -> personal content, visible only to that user.
Units and skills inherit their program's ownership. A user "forks" shared
content by cloning a program (POST /programs/{id}/clone) and then edits freely.

Enrichment rule: adding a skill to a program automatically reaches every
enrolled learner - SkillState rows are created lazily on first selection.

All timestamps are naive UTC.
"""
from datetime import datetime
from sqlalchemy import (
    String, Integer, Float, DateTime, ForeignKey, Text, Boolean,
    MetaData, UniqueConstraint, Index,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from . import config


def utcnow() -> datetime:
    return datetime.utcnow()


class Base(DeclarativeBase):
    # Deterministic constraint names so Alembic can alter them on SQLite too.
    metadata = MetaData(naming_convention={
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s",
    })


# =========================== CONTENT domain ================================

class Program(Base):
    """A curriculum: subject + level + region. owner_id NULL = shared library."""
    __tablename__ = "programs"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    subject: Mapped[str] = mapped_column(String(80), default="")
    level: Mapped[str] = mapped_column(String(80), default="")
    region: Mapped[str] = mapped_column(String(80), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft | published | archived
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    units: Mapped[list["Unit"]] = relationship(
        back_populates="program", cascade="all, delete-orphan", passive_deletes=True)
    skills: Mapped[list["Skill"]] = relationship(
        back_populates="program", cascade="all, delete-orphan", passive_deletes=True)


class Unit(Base):
    """Recursive material tree: a book, a chapter, an exercise set - all units."""
    __tablename__ = "units"
    id: Mapped[int] = mapped_column(primary_key=True)
    program_id: Mapped[int] = mapped_column(
        ForeignKey("programs.id", ondelete="CASCADE"), index=True)
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("units.id", ondelete="CASCADE"), nullable=True, index=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    title: Mapped[str] = mapped_column(String(300))
    content: Mapped[str] = mapped_column(Text, default="")  # curated notes / material
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    program: Mapped[Program] = relationship(back_populates="units")
    skills: Mapped[list["Skill"]] = relationship(
        back_populates="unit", cascade="all, delete-orphan", passive_deletes=True)


class Skill(Base):
    """An atomic masterable thing - what the agent drills and tracks."""
    __tablename__ = "skills"
    id: Mapped[int] = mapped_column(primary_key=True)
    program_id: Mapped[int] = mapped_column(
        ForeignKey("programs.id", ondelete="CASCADE"), index=True)
    unit_id: Mapped[int | None] = mapped_column(
        ForeignKey("units.id", ondelete="CASCADE"), nullable=True, index=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")  # extra context for question generation
    question_type: Mapped[str] = mapped_column(String(40), default="numeric")  # numeric|symbolic|mcq|code|rubric
    effort: Mapped[str] = mapped_column(String(10), default="quick")           # quick | deep

    program: Mapped[Program] = relationship(back_populates="skills")
    unit: Mapped[Unit | None] = relationship(back_populates="skills")
    questions: Mapped[list["Question"]] = relationship(
        back_populates="skill", cascade="all, delete-orphan", passive_deletes=True)


class Question(Base):
    """A curated bank question: trusted text + canonical answer + marking
    commentary. Practice can draw from the bank instead of (or before)
    LLM generation - see Enrollment.question_source."""
    __tablename__ = "questions"
    id: Mapped[int] = mapped_column(primary_key=True)
    skill_id: Mapped[int] = mapped_column(
        ForeignKey("skills.id", ondelete="CASCADE"), index=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    text: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text, default="")      # canonical worked answer
    commentary: Mapped[str] = mapped_column(Text, default="")  # marking guidance (what earns partial etc.)
    source: Mapped[str] = mapped_column(String(20), default="curated")  # curated | generated
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    skill: Mapped[Skill] = relationship(back_populates="questions")


# =========================== PERSONAL domain ===============================

class User(Base):
    """The learner: identity, scheduling preferences, LLM-derived memory."""
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), default="")
    timezone: Mapped[str] = mapped_column(String(60), default=config.DEFAULT_TIMEZONE)
    quiet_hours_start: Mapped[int] = mapped_column(Integer, default=config.DEFAULT_QUIET_HOURS_START)
    quiet_hours_end: Mapped[int] = mapped_column(Integer, default=config.DEFAULT_QUIET_HOURS_END)
    max_prompts_per_day: Mapped[int] = mapped_column(Integer, default=config.DEFAULT_MAX_PROMPTS_PER_DAY)
    daily_goal: Mapped[int] = mapped_column(Integer, default=3)  # answered questions/day target
    profile_note: Mapped[str] = mapped_column(Text, default="")  # LLM-derived semantic memory
    next_decision_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    devices: Mapped[list["Device"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    enrollments: Mapped[list["Enrollment"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True)


class NudgeWindow(Base):
    """When the tutor MAY nudge: per-weekday hour windows in the user's
    timezone (painted on the week grid in the app). No windows defined =
    fall back to the legacy quiet-hours pair on the user row."""
    __tablename__ = "nudge_windows"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True)
    weekday: Mapped[int] = mapped_column(Integer)     # 0=Monday .. 6=Sunday
    start_hour: Mapped[int] = mapped_column(Integer)  # inclusive, 0-23
    end_hour: Mapped[int] = mapped_column(Integer)    # exclusive, 1-24


class Device(Base):
    """A delivery endpoint. A user can have several (phone, telegram, console)."""
    __tablename__ = "devices"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True)
    channel: Mapped[str] = mapped_column(String(40))         # push | telegram | console
    channel_ref: Mapped[str] = mapped_column(String(300))    # expo token / chat_id / label
    label: Mapped[str] = mapped_column(String(120), default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    user: Mapped[User] = relationship(back_populates="devices")
    __table_args__ = (UniqueConstraint("user_id", "channel", "channel_ref"),)


class Enrollment(Base):
    """The bridge between the two domains: this user studies this program.

    Carries the learner-facing POLICY TOGGLES: enumerated strategy names the
    API validates against a fixed list (see agent.SELECTION_STRATEGIES and
    schemas.EnrollmentUpdate) and code resolves through a registry. Adding a
    strategy = one function + one registry entry; users can only pick names
    that exist."""
    __tablename__ = "enrollments"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True)
    program_id: Mapped[int] = mapped_column(
        ForeignKey("programs.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active | paused | completed
    exam_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    # --- policy toggles (validated enums + bounded numbers) ---
    selection_strategy: Mapped[str] = mapped_column(
        String(40), default="due_then_weakest")  # due_then_weakest | due_then_unseen | round_robin
    repeat_cooldown_hours: Mapped[float] = mapped_column(Float, default=6.0)
    marking_strictness: Mapped[str] = mapped_column(
        String(20), default="balanced")          # strict | balanced | lenient
    question_style: Mapped[str] = mapped_column(
        String(20), default="plain")             # plain (phone-friendly) | latex
    question_source: Mapped[str] = mapped_column(
        String(20), default="bank_first")        # bank_first | bank_only | generate_only
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    user: Mapped[User] = relationship(back_populates="enrollments")
    program: Mapped[Program] = relationship()
    skill_states: Mapped[list["SkillState"]] = relationship(
        back_populates="enrollment", cascade="all, delete-orphan", passive_deletes=True)
    __table_args__ = (UniqueConstraint("user_id", "program_id"),)


class SkillState(Base):
    """The adaptive core - one row per (enrollment, skill). Created lazily, so
    new skills added to a program automatically reach every enrolled learner."""
    __tablename__ = "skill_states"
    id: Mapped[int] = mapped_column(primary_key=True)
    enrollment_id: Mapped[int] = mapped_column(
        ForeignKey("enrollments.id", ondelete="CASCADE"), index=True)
    skill_id: Mapped[int] = mapped_column(
        ForeignKey("skills.id", ondelete="CASCADE"), index=True)
    score: Mapped[float] = mapped_column(Float, default=0.3)   # 0..1 mastery estimate
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    correct: Mapped[int] = mapped_column(Integer, default=0)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    due_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    interval_hours: Mapped[float] = mapped_column(Float, default=12.0)  # spaced repetition

    enrollment: Mapped[Enrollment] = relationship(back_populates="skill_states")
    skill: Mapped[Skill] = relationship()
    __table_args__ = (
        UniqueConstraint("enrollment_id", "skill_id"),
        Index("ix_skill_states_due_at", "due_at"),
    )


class Attempt(Base):
    """One question's lifecycle. The conversation about it lives in
    AttemptMessage rows; verdict/feedback land here when it closes."""
    __tablename__ = "attempts"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True)
    enrollment_id: Mapped[int | None] = mapped_column(
        ForeignKey("enrollments.id", ondelete="SET NULL"), nullable=True)
    skill_id: Mapped[int | None] = mapped_column(
        ForeignKey("skills.id", ondelete="SET NULL"), nullable=True)
    question_id: Mapped[int | None] = mapped_column(
        ForeignKey("questions.id", ondelete="SET NULL"), nullable=True)  # set = served from the bank
    source: Mapped[str] = mapped_column(String(20), default="on_demand")  # scheduled | on_demand
    question: Mapped[str] = mapped_column(Text, default="")
    answer: Mapped[str] = mapped_column(Text, default="")
    verdict: Mapped[str] = mapped_column(String(20), default="")  # "" (open) | correct | partial | wrong
    feedback: Mapped[str] = mapped_column(Text, default="")
    asked_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    answered_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    skill: Mapped[Skill | None] = relationship()
    messages: Mapped[list["AttemptMessage"]] = relationship(
        back_populates="attempt", cascade="all, delete-orphan", passive_deletes=True,
        order_by="AttemptMessage.id")
    __table_args__ = (Index("ix_attempts_user_open", "user_id", "verdict"),)


class AttemptMessage(Base):
    """One turn in the mini-conversation about a question: the question
    itself, coaching exchanges, the final answer, and the feedback."""
    __tablename__ = "attempt_messages"
    id: Mapped[int] = mapped_column(primary_key=True)
    attempt_id: Mapped[int] = mapped_column(
        ForeignKey("attempts.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(10))                 # tutor | student
    kind: Mapped[str] = mapped_column(String(12), default="chat")  # question | chat | answer | feedback
    content: Mapped[str] = mapped_column(Text, default="")
    modality: Mapped[str] = mapped_column(String(10), default="text")  # text | voice (transcribed)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    attempt: Mapped[Attempt] = relationship(back_populates="messages")


class Note(Base):
    """A private annotation a user pins on shared (or own) content."""
    __tablename__ = "notes"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True)
    unit_id: Mapped[int | None] = mapped_column(
        ForeignKey("units.id", ondelete="CASCADE"), nullable=True, index=True)
    skill_id: Mapped[int | None] = mapped_column(
        ForeignKey("skills.id", ondelete="CASCADE"), nullable=True, index=True)
    body: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


class NotificationLog(Base):
    """The notification OUTBOX + audit log. Deciding to nudge INSERTs a
    'queued' row (fast, transactional); a dispatcher drains queued rows and
    delivers them. Today the dispatcher is an in-process SQL poller
    (notifier.dispatch_pending); at scale, swap it for Redis/SQS workers
    behind the same function - nothing upstream changes. Also powers the
    daily cap, the history screen, and 'why didn't it ping me?'."""
    __tablename__ = "notification_log"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True)
    device_id: Mapped[int | None] = mapped_column(
        ForeignKey("devices.id", ondelete="SET NULL"), nullable=True)
    channel: Mapped[str] = mapped_column(String(40), default="")
    channel_ref: Mapped[str] = mapped_column(String(300), default="")
    body: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="queued", index=True)  # queued | sent | failed
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[str] = mapped_column(Text, default="")
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)  # when queued (intent time - powers the cap)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
