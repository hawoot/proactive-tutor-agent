# Adaptive insight reports (batch job)

**Status:** queued (future). Not started.

## Motivation
The app collects rich per-learner data (every attempt, per-skill mastery, distilled
notes) but never *steps back* to look across it. A periodic job that synthesises
"here's where you are, here's what's slipping, here's what to do" turns the app from
a question-server into something that actively manages the learner — and gives the
future server-side push channel something genuinely worth sending.

## Behaviour
- Runs on a schedule (e.g. **daily and/or weekly**) per active learner.
- Reads recent attempts + `SkillState` (score, attempts, due, `note`) + behavioural
  signals (see `02-behavioral-signals.md`) and produces a **report**:
  - what improved ("you've gone from shaky to solid on X"),
  - **gaps / weak basics** ("you keep tripping on the product rule"),
  - ambiguous signals to confirm with the learner (see #02).
- The report can then:
  1. **drive a push nudge** (the future server-decided notification "lab" — write
     to `User.next_decision_at` and hand a payload to the notifier), and/or
  2. **enrich the learner's course**: add remedial skills / a personal
     "Your weak points" program so the weak basics get practised.

## Data-model additions (when built)
- `Report` table: `id, user_id, period (daily|weekly), created_at, summary (text),
  payload (json: gaps[], improved[], questions_to_confirm[])`.
- (Optional) a `Notification`/delivery table — purpose-built for this. (The old
  `NotificationLog` server-push outbox has been removed; reminders fire on the device.)

## API (when built)
- `POST /reports/run?user_id=` — generate now (also callable by a future periodic job).
- `GET /reports?user_id=` — list/most-recent, for an in-app "Your progress" view.

## Job logic (sketch)
1. Gather: recent `Attempt`s (window), all `SkillState` for the user, signals.
2. Summarise with ONE LLM call per learner (cheap; batched offline, latency doesn't
   matter here): feed the structured stats + notes, ask for {summary, gaps[],
   improved[], confirm[]}.
3. Persist a `Report` row.
4. Optionally act: enrich course (add/flag remedial skills) and/or set
   `next_decision_at` + queue a nudge.

## Hooks already in place (so this is additive, not a rebuild)
- `Attempt` log is append-only and timestamped — the raw material.
- `SkillState.note` + `User.profile_note` are already LLM-distilled summaries.
- the `reminders` module is the natural home for a periodic runner (today it only
  computes next-reminder-time; there is no server loop yet — this feature would
  add the first one).
- Personal content + lazy `ensure_skill_states` already lets a job add remedial
  skills that automatically reach the enrolled learner.
- `User.next_decision_at` exists as the server-side-nudge hook.

## Open questions
- Daily vs weekly cadence (or both)?
- In-app report view as well as a push, or push-only to start?
- How aggressive should auto-enrichment be vs. just suggesting?
