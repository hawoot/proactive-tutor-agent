"""The content domain: programs, units, skills. Full CRUD + tree + clone.

Visibility: GET /programs?user_id=N returns shared content (owner_id NULL)
plus N's personal programs. Writes are allowed on shared content (single-
operator deployment) and on your own; never on another user's."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Program, Unit, Skill, Question, Enrollment
from ..schemas import (
    ProgramCreate, ProgramUpdate, ProgramOut,
    UnitCreate, UnitUpdate, UnitNode,
    SkillCreate, SkillUpdate, SkillOut,
    QuestionCreate, QuestionUpdate, QuestionOut,
)

router = APIRouter(tags=["library"])


def get_program_or_404(db: Session, program_id: int) -> Program:
    prog = db.get(Program, program_id)
    if not prog:
        raise HTTPException(404, f"Unknown program {program_id}")
    return prog


def check_can_edit(prog: Program, user_id: int | None) -> None:
    if prog.owner_id is not None and prog.owner_id != user_id:
        raise HTTPException(403, "This program belongs to another user")


# --- programs ----------------------------------------------------------------

@router.get("/programs", response_model=list[ProgramOut])
def list_programs(user_id: int | None = None, db: Session = Depends(get_db)):
    q = select(Program).order_by(Program.id)
    if user_id is not None:
        q = q.where(or_(Program.owner_id == None, Program.owner_id == user_id))  # noqa: E711
    programs = db.execute(q).scalars().all()
    enrolled_ids = set()
    if user_id is not None:
        enrolled_ids = {
            pid for (pid,) in db.execute(
                select(Enrollment.program_id).where(Enrollment.user_id == user_id))
        }
    out = []
    for p in programs:
        item = ProgramOut.model_validate(p)
        item.unit_count = db.execute(
            select(func.count(Unit.id)).where(Unit.program_id == p.id)).scalar() or 0
        item.skill_count = db.execute(
            select(func.count(Skill.id)).where(Skill.program_id == p.id)).scalar() or 0
        item.enrolled = p.id in enrolled_ids
        out.append(item)
    return out


@router.post("/programs", response_model=ProgramOut)
def create_program(body: ProgramCreate, db: Session = Depends(get_db)):
    prog = Program(**body.model_dump())
    db.add(prog)
    db.commit()
    return ProgramOut.model_validate(prog)


@router.patch("/programs/{program_id}", response_model=ProgramOut)
def update_program(program_id: int, body: ProgramUpdate,
                   user_id: int | None = None, db: Session = Depends(get_db)):
    prog = get_program_or_404(db, program_id)
    check_can_edit(prog, user_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(prog, field, value)
    db.commit()
    return ProgramOut.model_validate(prog)


@router.delete("/programs/{program_id}")
def delete_program(program_id: int, user_id: int | None = None,
                   db: Session = Depends(get_db)):
    prog = get_program_or_404(db, program_id)
    check_can_edit(prog, user_id)
    db.delete(prog)  # cascades: units, skills, enrollments, skill states
    db.commit()
    return {"ok": True}


@router.post("/programs/{program_id}/clone", response_model=ProgramOut)
def clone_program(program_id: int, user_id: int, db: Session = Depends(get_db)):
    """Deep-copy a (typically shared) program into the user's personal space."""
    src = get_program_or_404(db, program_id)
    dst = Program(
        owner_id=user_id, title=f"{src.title} (my copy)", subject=src.subject,
        level=src.level, region=src.region, description=src.description,
        status=src.status,
    )
    db.add(dst); db.flush()

    unit_map: dict[int, int] = {}

    def copy_units(parent_src_id: int | None, parent_dst_id: int | None) -> None:
        rows = db.execute(
            select(Unit).where(Unit.program_id == src.id, Unit.parent_id == parent_src_id)
            .order_by(Unit.position, Unit.id)
        ).scalars().all()
        for u in rows:
            nu = Unit(program_id=dst.id, parent_id=parent_dst_id,
                      position=u.position, title=u.title, content=u.content)
            db.add(nu); db.flush()
            unit_map[u.id] = nu.id
            copy_units(u.id, nu.id)

    copy_units(None, None)
    for s in db.execute(select(Skill).where(Skill.program_id == src.id)).scalars():
        db.add(Skill(
            program_id=dst.id, unit_id=unit_map.get(s.unit_id) if s.unit_id else None,
            position=s.position, name=s.name, description=s.description,
            question_type=s.question_type, effort=s.effort,
        ))
    db.commit()
    return ProgramOut.model_validate(dst)


# --- the tree (what the Library screen renders) ---------------------------------

@router.get("/programs/{program_id}/tree", response_model=list[UnitNode])
def program_tree(program_id: int, db: Session = Depends(get_db)):
    get_program_or_404(db, program_id)
    units = db.execute(
        select(Unit).where(Unit.program_id == program_id)
        .order_by(Unit.position, Unit.id)
    ).scalars().all()
    skills = db.execute(
        select(Skill).where(Skill.program_id == program_id)
        .order_by(Skill.position, Skill.id)
    ).scalars().all()

    # Build nodes explicitly: model_validate(u) would also pull the ORM
    # skills relationship, duplicating every skill we append below.
    nodes = {u.id: UnitNode(
        id=u.id, program_id=u.program_id, parent_id=u.parent_id,
        position=u.position, title=u.title, content=u.content,
    ) for u in units}
    for s in skills:
        if s.unit_id in nodes:
            nodes[s.unit_id].skills.append(SkillOut.model_validate(s))
    roots: list[UnitNode] = []
    for u in units:
        node = nodes[u.id]
        if u.parent_id and u.parent_id in nodes:
            nodes[u.parent_id].children.append(node)
        else:
            roots.append(node)
    return roots


@router.get("/programs/{program_id}/skills", response_model=list[SkillOut])
def program_skills(program_id: int, db: Session = Depends(get_db)):
    """Flat skill list, including skills not attached to any unit."""
    get_program_or_404(db, program_id)
    return db.execute(
        select(Skill).where(Skill.program_id == program_id)
        .order_by(Skill.position, Skill.id)
    ).scalars().all()


# --- units ------------------------------------------------------------------------

@router.post("/units", response_model=UnitNode)
def create_unit(body: UnitCreate, user_id: int | None = None,
                db: Session = Depends(get_db)):
    prog = get_program_or_404(db, body.program_id)
    check_can_edit(prog, user_id)
    if body.parent_id is not None:
        parent = db.get(Unit, body.parent_id)
        if not parent or parent.program_id != body.program_id:
            raise HTTPException(400, "parent_id must be a unit of the same program")
    unit = Unit(**body.model_dump())
    db.add(unit)
    db.commit()
    return UnitNode.model_validate(unit)


@router.patch("/units/{unit_id}", response_model=UnitNode)
def update_unit(unit_id: int, body: UnitUpdate, user_id: int | None = None,
                db: Session = Depends(get_db)):
    unit = db.get(Unit, unit_id)
    if not unit:
        raise HTTPException(404, "Unknown unit")
    check_can_edit(unit.program, user_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(unit, field, value)
    db.commit()
    return UnitNode.model_validate(unit)


@router.delete("/units/{unit_id}")
def delete_unit(unit_id: int, user_id: int | None = None,
                db: Session = Depends(get_db)):
    unit = db.get(Unit, unit_id)
    if not unit:
        raise HTTPException(404, "Unknown unit")
    check_can_edit(unit.program, user_id)
    db.delete(unit)  # cascades: child units + their skills
    db.commit()
    return {"ok": True}


# --- skills ------------------------------------------------------------------------

@router.post("/skills", response_model=SkillOut)
def create_skill(body: SkillCreate, user_id: int | None = None,
                 db: Session = Depends(get_db)):
    prog = get_program_or_404(db, body.program_id)
    check_can_edit(prog, user_id)
    if body.unit_id is not None:
        unit = db.get(Unit, body.unit_id)
        if not unit or unit.program_id != body.program_id:
            raise HTTPException(400, "unit_id must be a unit of the same program")
    skill = Skill(**body.model_dump())
    db.add(skill)
    db.commit()
    return SkillOut.model_validate(skill)


@router.patch("/skills/{skill_id}", response_model=SkillOut)
def update_skill(skill_id: int, body: SkillUpdate, user_id: int | None = None,
                 db: Session = Depends(get_db)):
    skill = db.get(Skill, skill_id)
    if not skill:
        raise HTTPException(404, "Unknown skill")
    check_can_edit(skill.program, user_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(skill, field, value)
    db.commit()
    return SkillOut.model_validate(skill)


@router.delete("/skills/{skill_id}")
def delete_skill(skill_id: int, user_id: int | None = None,
                 db: Session = Depends(get_db)):
    skill = db.get(Skill, skill_id)
    if not skill:
        raise HTTPException(404, "Unknown skill")
    check_can_edit(skill.program, user_id)
    db.delete(skill)  # cascades skill_states; attempts keep history (skill_id null)
    db.commit()
    return {"ok": True}


# --- question bank (curated questions + canonical answers per skill) ----------

@router.get("/skills/{skill_id}/questions", response_model=list[QuestionOut])
def list_questions(skill_id: int, db: Session = Depends(get_db)):
    if not db.get(Skill, skill_id):
        raise HTTPException(404, "Unknown skill")
    return db.execute(
        select(Question).where(Question.skill_id == skill_id)
        .order_by(Question.position, Question.id)
    ).scalars().all()


@router.post("/questions", response_model=QuestionOut)
def create_question(body: QuestionCreate, user_id: int | None = None,
                    db: Session = Depends(get_db)):
    skill = db.get(Skill, body.skill_id)
    if not skill:
        raise HTTPException(404, "Unknown skill")
    check_can_edit(skill.program, user_id)
    q = Question(**body.model_dump())
    db.add(q)
    db.commit()
    return QuestionOut.model_validate(q)


@router.patch("/questions/{question_id}", response_model=QuestionOut)
def update_question(question_id: int, body: QuestionUpdate,
                    user_id: int | None = None, db: Session = Depends(get_db)):
    q = db.get(Question, question_id)
    if not q:
        raise HTTPException(404, "Unknown question")
    check_can_edit(q.skill.program, user_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(q, field, value)
    db.commit()
    return QuestionOut.model_validate(q)


@router.delete("/questions/{question_id}")
def delete_question(question_id: int, user_id: int | None = None,
                    db: Session = Depends(get_db)):
    q = db.get(Question, question_id)
    if not q:
        raise HTTPException(404, "Unknown question")
    check_can_edit(q.skill.program, user_id)
    db.delete(q)  # attempts keep their copy of the text (question_id -> NULL)
    db.commit()
    return {"ok": True}
