"""
The data model. Three logical stores collapsed into one relational DB for the
prototype (split Postgres/Redis later). Everything is multi-tenant by column.

  Program   : a subject+level+region (the curriculum skeleton)
  Unit       : recursive content tree (chapter/section, act/scene...) + notes
  Skill      : an atomic masterable thing, attached to a unit
  Student    : the learner + their derived profile_note
  Enrollment : student <-> program, with its own exam date + per-skill mastery
  Mastery    : per (enrollment, skill) progress - the adaptive core
  Interaction: append-only event log (questions asked, answers, verdicts)
"""
from datetime import datetime
from sqlalchemy import (
    create_engine, String, Integer, Float, DateTime, ForeignKey, Text, Boolean,
)
from sqlalchemy.orm import (
    DeclarativeBase, Mapped, mapped_column, sessionmaker,
)
from . import config

engine = create_engine(config.DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Program(Base):
    __tablename__ = "programs"
    id: Mapped[int] = mapped_column(primary_key=True)
    subject: Mapped[str] = mapped_column(String(80))      # "maths", "quant-dev"
    level: Mapped[str] = mapped_column(String(80))        # "A-level", "interview"
    region: Mapped[str] = mapped_column(String(80), default="")
    scope: Mapped[str] = mapped_column(String(120), default="global")  # global | student:{id}


class Unit(Base):
    """Recursive content tree. A book, a chapter, an exercise set - all units."""
    __tablename__ = "units"
    id: Mapped[int] = mapped_column(primary_key=True)
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"))
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("units.id"), nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
    title: Mapped[str] = mapped_column(String(300))
    notes: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft | approved
    scope: Mapped[str] = mapped_column(String(120), default="global")


class Skill(Base):
    __tablename__ = "skills"
    id: Mapped[int] = mapped_column(primary_key=True)
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"))
    unit_id: Mapped[int | None] = mapped_column(ForeignKey("units.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(200))
    question_type: Mapped[str] = mapped_column(String(40), default="numeric")  # numeric|symbolic|mcq|code|rubric
    effort: Mapped[str] = mapped_column(String(10), default="quick")           # quick | deep


class Student(Base):
    __tablename__ = "students"
    id: Mapped[int] = mapped_column(primary_key=True)
    channel: Mapped[str] = mapped_column(String(40), default="console")  # console|telegram|push
    channel_ref: Mapped[str] = mapped_column(String(200), default="")    # chat_id / expo push token
    profile_note: Mapped[str] = mapped_column(Text, default="")          # LLM-derived semantic memory
    next_decision_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class Enrollment(Base):
    __tablename__ = "enrollments"
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"))
    exam_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    mode: Mapped[str] = mapped_column(String(20), default="correct")  # correct | read


class Mastery(Base):
    """The adaptive core - one row per (enrollment, skill)."""
    __tablename__ = "mastery"
    id: Mapped[int] = mapped_column(primary_key=True)
    enrollment_id: Mapped[int] = mapped_column(ForeignKey("enrollments.id"))
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"))
    score: Mapped[float] = mapped_column(Float, default=0.3)      # 0..1
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    last_seen: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    due_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    interval_hours: Mapped[float] = mapped_column(Float, default=12.0)  # spaced repetition


class Interaction(Base):
    __tablename__ = "interactions"
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    skill_id: Mapped[int | None] = mapped_column(ForeignKey("skills.id"), nullable=True)
    question: Mapped[str] = mapped_column(Text, default="")
    answer: Mapped[str] = mapped_column(Text, default="")
    verdict: Mapped[str] = mapped_column(String(20), default="")
    self_directed: Mapped[bool] = mapped_column(Boolean, default=False)  # keep off the core signal
    ts: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


def init_db() -> None:
    Base.metadata.create_all(engine)
