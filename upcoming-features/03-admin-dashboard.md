# Admin dashboard (web app)

**Status:** queued (future). Not started.

## Motivation
Content is data managed through the API (see `docs/DATA.md`), and increasingly the
operator needs to *see* and *manage* it directly: browse the curriculum, add/edit/
remove content, inspect the database, search users and their data, and read logs.
Doing this by hand-crafting API calls doesn't scale. We want a **web admin app** that
sits on top of the existing API and is the human UI for all of it.

## What it does
- **Content management:** browse Programs → Units → Skills → Questions; create, edit,
  delete; tag questions with mode/style; bulk-author. (All via the existing content
  endpoints in `docs/DATA.md`.)
- **Curriculum view:** the unit/skill tree, question counts, coverage by mode.
- **Database / data view:** read-only views of the personal domain — users,
  enrollments, per-skill `SkillState` (mastery, due, notes), the `Attempt` log.
- **Search:** users, skills, questions, attempts.
- **Logs:** backend log / health, and (later) generated reports + nudge history.
- **Manual edits:** add/remove content, fix data, adjust a user's enrollment/policy.

## Shape (proposal)
- A small **web app** (its own folder, e.g. `admin/`) — React/Vite or similar — that
  talks to the **same backend API** with the `X-API-Key`. No new backend logic needed
  for the content side; it reuses the CRUD endpoints.
- Read-only DB/inspection views may need a few **new read endpoints** (e.g.
  `GET /attempts`, `GET /users`, a richer `GET /progress`) — additive, no schema change.
- Auth: gated by the API key (single operator) to start.

## Hooks already in place
- Full content CRUD already exists (`/programs`, `/units`, `/skills`, `/questions`).
- `/today`, `/progress`, `/attempts`, `/notifications` already expose personal data.
- The two-domain schema (content vs personal) maps cleanly to dashboard sections.

## Open questions
- Framework (React/Vite vs server-rendered) and where it's hosted.
- How much DB inspection is read-only vs editable.
- Bulk-import format for authoring a curriculum quickly.
