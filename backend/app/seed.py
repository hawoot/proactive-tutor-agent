"""Demo seed: one SHARED library program (A-level Maths with a unit tree and
skills) + one user enrolled in it. Idempotent - safe to call twice."""
from sqlalchemy import select
from sqlalchemy.orm import Session
from .models import Program, Unit, Skill, User, Enrollment


def seed(db: Session) -> dict:
    if db.execute(select(Program)).scalars().first():
        user = db.execute(select(User)).scalars().first()
        return {"note": "already seeded", "user_id": user.id if user else None}

    prog = Program(
        owner_id=None,  # shared library content
        title="A-level Maths (UK)", subject="maths", level="A-level",
        region="UK", status="published",
        description="Core pure-maths skills for the UK A-level, organised by topic.",
    )
    db.add(prog); db.flush()

    pure = Unit(program_id=prog.id, title="Pure Mathematics", position=0)
    db.add(pure); db.flush()
    calculus = Unit(program_id=prog.id, parent_id=pure.id, title="Calculus", position=0,
                    content="Differentiation and integration of standard functions.")
    algebra = Unit(program_id=prog.id, parent_id=pure.id, title="Algebra & Series", position=1,
                   content="Binomial expansion, sequences and series.")
    db.add_all([calculus, algebra]); db.flush()

    db.add_all([
        Skill(program_id=prog.id, unit_id=calculus.id, position=0,
              name="Differentiation rules", question_type="symbolic", effort="quick",
              description="Product, quotient and chain rule on polynomial/trig/exp functions."),
        Skill(program_id=prog.id, unit_id=calculus.id, position=1,
              name="Integration by parts", question_type="symbolic", effort="deep"),
        Skill(program_id=prog.id, unit_id=algebra.id, position=0,
              name="Binomial expansion", question_type="numeric", effort="quick"),
    ])

    user = User(name="Me")
    db.add(user); db.flush()
    db.add(Enrollment(user_id=user.id, program_id=prog.id))
    db.commit()
    return {"user_id": user.id, "program_id": prog.id, "program": prog.title}
