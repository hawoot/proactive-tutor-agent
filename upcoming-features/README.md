# Upcoming features (idea queue)

A durable home for features we've brainstormed but **not built yet** — so the
ideas survive across sessions (each chat is a fresh context and loses the rest).

## Convention
- One markdown file per feature, prefixed with a number for rough priority.
- Each file is written as a **spec a future session can implement from** — not
  just a note. Include: motivation, behaviour/UX, data-model and API changes,
  and any hooks already in place.
- When a feature ships: move its file into `done/` (create it) **or** delete it,
  and remove it from the list below.

## In the queue
1. [`01-adaptive-insight-reports.md`](01-adaptive-insight-reports.md) — a periodic
   (daily/weekly) batch job that summarises recent performance into a gaps report;
   feeds future server-side push nudges and can enrich the learner's course with
   remedial skills.
2. [`02-behavioral-signals.md`](02-behavioral-signals.md) — record behavioural
   signals (skip, "show me the solution", which help button) so the batch job can
   tell *struggling* from *bored*, and the report can ask the learner to confirm.

> These two are related: #02 produces the signals that #01 consumes.
