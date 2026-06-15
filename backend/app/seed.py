"""Bootstrap only - NO curriculum content.

Curriculum content (programs, units, skills, questions) is DATA and lives in the
database; it is created and managed exclusively through the API (see docs/BACKEND_API.md).
Nothing is ever baked into code here. `seed()` just ensures a single user exists so
a fresh backend is usable; everything else is added via the API. Idempotent."""
from sqlalchemy import select
from sqlalchemy.orm import Session
from .models import User


def seed(db: Session) -> dict:
    user = db.execute(select(User)).scalars().first()
    if user:
        return {"note": "already seeded", "user_id": user.id}
    user = User(name="Me")
    db.add(user)
    db.commit()
    return {"user_id": user.id, "note": "bootstrap user created - add content via the API"}
