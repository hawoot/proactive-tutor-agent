# Data & content — how it's managed (read this before touching content)

**The rule: curriculum content is DATA. It lives in the database and is created,
edited and removed ONLY through the HTTP API. Never bake content into code.**

There is **no** "seed a curriculum" path, no curriculum data files, and no loader
scripts. `app/seed.py` only ever creates a single bootstrap user. If you find any
code that inserts programs/units/skills/questions, delete it — that's a bug.

## Why
- Content changes constantly; code changes shouldn't. Pushing content through PRs
  and redeploys was slow, noisy, and coupled data to releases.
- A schema migration forces a reset; **data managed via the API survives** (no reseed).
- An **admin web app** (see `upcoming-features/03-admin-dashboard.md`) will be the
  human UI over these same endpoints.

## The two domains (kept cleanly separate)
- **CONTENT** (shareable, the curated library): `Program → Unit (tree) → Skill → Question`.
  `Program.owner_id IS NULL` = shared/global; set = personal to that user.
- **PERSONAL** (one learner's world): `User`, `Enrollment`, `SkillState`, `Attempt`,
  `AttemptMessage`, `Device`, `Note`. Linked to content only through `Enrollment`.

Content and personal data never mix in one table; the only bridge is `Enrollment`.

## Managing content through the API
All write endpoints are gated by the `X-API-Key` header and take `?user_id=` for
ownership checks. Shared content (owner_id NULL) is editable in this single-operator
setup.

```
# Program
POST   /programs                       {title, subject, level, region, description, owner_id}
PATCH  /programs/{id}?user_id=         {title?, status?, ...}
DELETE /programs/{id}?user_id=         # cascades to units/skills/questions/enrollments/state
POST   /programs/{id}/clone?user_id=   # deep copy into the user's space
GET    /programs?user_id=              # shared + that user's
GET    /programs/{id}/tree             # full unit/skill tree

# Unit  (recursive via parent_id)
POST   /units?user_id=                 {program_id, parent_id?, title, content, position}
PATCH  /units/{id}?user_id=
DELETE /units/{id}?user_id=

# Skill
POST   /skills?user_id=                {program_id, unit_id?, name, description, kind, position}
PATCH  /skills/{id}?user_id=           # kind ∈ math|code|stats|concept
DELETE /skills/{id}?user_id=

# Question (the curated bank)
POST   /questions?user_id=             {skill_id, text, answer, commentary, mode, style, position}
PATCH  /questions/{id}?user_id=        # mode ∈ on_the_go|short_drill|problem
DELETE /questions/{id}?user_id=
GET    /skills/{id}/questions
```

`mode` is the practice mode a question belongs to; `style` is the on-the-go flavour
(`trap|misconception|true_false|concept|counterexample|example|mcq`). Problem answers
should spell out the steps.

## Authoring a whole curriculum (until the admin app exists)
Write a **throwaway script** (not committed as app code) that holds the content as
plain data and POSTs it through the endpoints above — idempotent (check by title,
or delete-then-recreate the program). This keeps the content out of the app code
while still being repeatable. See git history (closed PR #24 / branch
`claude/quantdev-content`) for an example of the *data*, but do not re-introduce it
into `app/`.
