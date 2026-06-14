"""Demo seed: the shared A-level Maths + Quant Developer Prep curricula + curated
question banks (app/curricula/) + one user enrolled in both. Idempotent - safe to
call twice. Curricula data still carries the old question_type/effort hints; we map
question_type -> Skill.kind here so the data files don't need rewriting."""
from sqlalchemy import select
from sqlalchemy.orm import Session
from .models import Program, Unit, Skill, Question, User, Enrollment
from .curricula import alevel_maths_uk, alevel_maths_uk_questions, quant_dev


def _kind_for(question_type: str) -> str:
    if question_type == "code":
        return "code"
    if question_type in ("rubric", "mcq"):
        return "concept"
    return "math"


def _create_tree(db: Session, program_id: int, nodes, questions, parent_id=None) -> None:
    for pos, node in enumerate(nodes):
        unit = Unit(program_id=program_id, parent_id=parent_id, position=pos,
                    title=node["title"], content=node.get("content", ""))
        db.add(unit)
        db.flush()
        for spos, sk in enumerate(node.get("skills", [])):
            data = dict(sk)
            qtype = data.pop("question_type", "numeric")
            data.pop("effort", None)
            data.setdefault("kind", _kind_for(qtype))
            skill = Skill(program_id=program_id, unit_id=unit.id, position=spos, **data)
            db.add(skill)
            db.flush()
            for qpos, q in enumerate(questions.get(sk["name"], [])):
                db.add(Question(skill_id=skill.id, position=qpos, **q))
        _create_tree(db, program_id, node.get("children", []), questions, unit.id)


def _create_program(db: Session, module, questions) -> Program:
    prog = Program(owner_id=None, **module.PROGRAM)  # shared library content
    db.add(prog)
    db.flush()
    _create_tree(db, prog.id, module.TREE, questions)
    return prog


def seed(db: Session) -> dict:
    if db.execute(select(Program)).scalars().first():
        user = db.execute(select(User)).scalars().first()
        return {"note": "already seeded", "user_id": user.id if user else None}

    maths = _create_program(db, alevel_maths_uk, alevel_maths_uk_questions.QUESTIONS)
    quant = _create_program(db, quant_dev, quant_dev.QUESTIONS)

    user = User(name="Me")
    db.add(user)
    db.flush()
    db.add(Enrollment(user_id=user.id, program_id=maths.id))
    db.add(Enrollment(user_id=user.id, program_id=quant.id))
    db.commit()
    n_skills = len(db.execute(select(Skill)).scalars().all())
    return {"user_id": user.id, "programs": [maths.title, quant.title], "skills": n_skills}
