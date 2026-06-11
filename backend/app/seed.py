"""Demo seed: the full shared A-level Maths curriculum + curated question
bank (app/curricula/) + one enrolled user. Idempotent - safe to call twice."""
from sqlalchemy import select
from sqlalchemy.orm import Session
from .models import Program, Unit, Skill, Question, User, Enrollment
from .curricula import alevel_maths_uk, alevel_maths_uk_questions


def _create_tree(db: Session, program_id: int, nodes, parent_id=None) -> None:
    for pos, node in enumerate(nodes):
        unit = Unit(program_id=program_id, parent_id=parent_id, position=pos,
                    title=node["title"], content=node.get("content", ""))
        db.add(unit)
        db.flush()
        for spos, sk in enumerate(node.get("skills", [])):
            skill = Skill(program_id=program_id, unit_id=unit.id, position=spos, **sk)
            db.add(skill)
            db.flush()
            for qpos, q in enumerate(
                    alevel_maths_uk_questions.QUESTIONS.get(sk["name"], [])):
                db.add(Question(skill_id=skill.id, position=qpos, **q))
        _create_tree(db, program_id, node.get("children", []), unit.id)


def seed(db: Session) -> dict:
    if db.execute(select(Program)).scalars().first():
        user = db.execute(select(User)).scalars().first()
        return {"note": "already seeded", "user_id": user.id if user else None}

    prog = Program(owner_id=None, **alevel_maths_uk.PROGRAM)  # shared library content
    db.add(prog)
    db.flush()
    _create_tree(db, prog.id, alevel_maths_uk.TREE)

    user = User(name="Me")
    db.add(user)
    db.flush()
    db.add(Enrollment(user_id=user.id, program_id=prog.id))
    db.commit()
    n_skills = len(db.execute(
        select(Skill).where(Skill.program_id == prog.id)).scalars().all())
    return {"user_id": user.id, "program_id": prog.id,
            "program": prog.title, "skills": n_skills}
