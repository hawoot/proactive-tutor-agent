"""
ContextRetriever - the ONLY thing that knows where context lives.

The agent hands a (user, skill) pair in and gets a ContextBundle back; it
never touches tables to build prompts. Three sources, independently swappable:

  shared    : curriculum material - unit tree content, skill description.
              (Later: embeddings/search over big programs. Same method.)
  personal  : this learner - LLM-distilled profile note, recent performance
              and mistakes on this skill. (Later: richer learner model.)
  session   : the current exchange window - today's questions, so the
              generator doesn't repeat itself. (Later: Redis with TTLs.)

Also owns the write side of semantic memory: maybe_update_profile() distills
the learner's recent attempts into User.profile_note every few answers.
"""
from dataclasses import dataclass
from datetime import timedelta
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from . import llm
from .models import utcnow, User, Skill, Unit, Attempt, SkillState, Enrollment

SHARED_CHARS = 2000      # budget per section, keeps prompts bounded
RECENT_ATTEMPTS = 5
PROFILE_UPDATE_EVERY = 3  # distill semantic memory every N marked answers


@dataclass
class ContextBundle:
    shared: str    # curriculum material for the skill
    personal: str  # who this learner is + how they did on this skill
    session: str   # today's recent questions (repeat-avoidance)


class ContextRetriever:
    def __init__(self, db: Session):
        self.db = db

    # --- shared (curriculum) -------------------------------------------------

    def shared(self, skill: Skill) -> str:
        parts = []
        if skill.description:
            parts.append(f"Skill notes: {skill.description}")
        if skill.unit_id:
            unit = self.db.get(Unit, skill.unit_id)
            if unit and unit.content:
                parts.append(f"Source material (stay within it):\n{unit.content[:SHARED_CHARS]}")
        return "\n".join(parts)

    # --- personal (this learner) ---------------------------------------------

    def personal(self, user: User, skill: Skill) -> str:
        parts = []
        if user.profile_note:
            parts.append(f"Learner profile: {user.profile_note[:SHARED_CHARS]}")
        note = self.db.execute(
            select(SkillState.note)
            .join(Enrollment, Enrollment.id == SkillState.enrollment_id)
            .where(Enrollment.user_id == user.id, SkillState.skill_id == skill.id)
        ).scalars().first()
        if note:
            parts.append(f"What this learner tends to trip on with this skill: {note}")
        recent = self.db.execute(
            select(Attempt)
            .where(Attempt.user_id == user.id, Attempt.skill_id == skill.id,
                   Attempt.verdict.in_(["correct", "partial", "wrong"]))
            .order_by(Attempt.asked_at.desc()).limit(RECENT_ATTEMPTS)
        ).scalars().all()
        if recent:
            lines = [f"- [{a.verdict}] {a.question[:150]}" for a in recent]
            parts.append("Recent attempts on this skill (most recent first):\n" + "\n".join(lines))
        return "\n".join(parts)

    # --- session (the current window) ------------------------------------------

    def session(self, user: User) -> str:
        start = utcnow() - timedelta(hours=24)
        recent = self.db.execute(
            select(Attempt.question)
            .where(Attempt.user_id == user.id, Attempt.asked_at >= start)
            .order_by(Attempt.asked_at.desc()).limit(RECENT_ATTEMPTS)
        ).scalars().all()
        if not recent:
            return ""
        lines = [f"- {q[:150]}" for q in recent]
        return "Questions already asked in the last 24h (do NOT repeat or near-duplicate):\n" + "\n".join(lines)

    def build(self, user: User, skill: Skill) -> ContextBundle:
        return ContextBundle(
            shared=self.shared(skill),
            personal=self.personal(user, skill),
            session=self.session(user),
        )


# --- semantic memory writer ------------------------------------------------

def maybe_update_profile(db: Session, user: User) -> None:
    """Every PROFILE_UPDATE_EVERY marked answers, distill recent performance
    into a short learner profile the question generator can condition on."""
    marked = db.execute(
        select(func.count(Attempt.id)).where(
            Attempt.user_id == user.id,
            Attempt.verdict.in_(["correct", "partial", "wrong"]))
    ).scalar() or 0
    if marked == 0 or marked % PROFILE_UPDATE_EVERY != 0:
        return
    recent = db.execute(
        select(Attempt)
        .where(Attempt.user_id == user.id,
               Attempt.verdict.in_(["correct", "partial", "wrong"]))
        .order_by(Attempt.asked_at.desc()).limit(10)
    ).scalars().all()
    history = "\n".join(
        f"- [{a.verdict}] Q: {a.question[:120]} | feedback: {a.feedback[:120]}"
        for a in recent
    )
    user.profile_note = llm.ask(
        f"""You maintain a tutoring profile of one learner. Rewrite it from the
evidence below. <=120 words, plain prose: strengths, recurring mistakes,
level. No preamble.

Current profile: {user.profile_note or '(none yet)'}

Recent marked answers:
{history}""",
        max_tokens=250,
    )


def maybe_update_skill_note(db: Session, user: User, skill: Skill,
                            st: SkillState, verdict: str) -> None:
    """Per-skill memory. After a miss, distil the SPECIFIC recurring thing the
    learner trips on for THIS skill - so the next question and the coaching can
    target it, and the engine knows where the floor is. Only runs on wrong/partial
    (that's when there's a mistake worth remembering); a clean run leaves it."""
    if verdict not in ("wrong", "partial"):
        return
    recent = db.execute(
        select(Attempt).where(
            Attempt.user_id == user.id, Attempt.skill_id == skill.id,
            Attempt.verdict.in_(["correct", "partial", "wrong"]))
        .order_by(Attempt.asked_at.desc()).limit(RECENT_ATTEMPTS)
    ).scalars().all()
    if not recent:
        return
    history = "\n".join(
        f"- [{a.verdict}] Q: {a.question[:120]} | feedback: {a.feedback[:120]}"
        for a in recent)
    st.note = (llm.ask(
        f"""In <=30 words, note the SPECIFIC recurring mistake or missing prerequisite
this learner shows on the skill "{skill.name}" - what a tutor should watch for or
shore up next time. If they now look solid, say so. No preamble.

Recent attempts on this skill:
{history}""",
        max_tokens=120,
    ) or "").strip()
