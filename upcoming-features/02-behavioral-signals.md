# Behavioural signals (skip / show-answer / help usage)

**Status:** queued (future). Not started. *(Cheap to start *logging* early — see note.)*

## Motivation
How a learner *interacts* is a strong signal we currently throw away:
- Tapping **"Show me the solution"** → they probably couldn't do it → *struggling*.
- Tapping **"Back up to basics"** (🪜) → an explicit *I'm missing prerequisites* → strong struggling signal (already user-declared).
- Tapping **"Walk me through it"** → mild: needed scaffolding but engaged.
- **Skip** → ambiguous: either *struggling* (avoidance) **or** *too easy / waste of time* (mastery). We must not force a reason at skip time (skip stays one tap), so we **infer later** and, if still ambiguous, **ask** in the report.

These feed `01-adaptive-insight-reports.md`: "you keep asking for the answer on X → struggling"; "you keep skipping Y → are you good at it, or avoiding it?". If the learner confirms *good*, mark the skill off (boost mastery / mark mastered); if *struggling*, treat it as a weak basic and remediate.

## Behaviour
- Record, per attempt, the help interactions and the close reason. No new friction —
  skip stays one tap; the disambiguation happens in the report, not in the moment.
- The batch job aggregates per skill:
  - repeated `show_solution` and/or `back_to_basics` → flag **struggling**.
  - repeated `skip` with no other signal → flag **ambiguous** → add to the report's
    "confirm" list ("You keep skipping <skill> — are you comfortable with it?").
  - learner's answer in the report → if "comfortable" → bump mastery / mark off;
    if "struggling" → enrol it as a weak point (see #01 enrichment).

## Data-model additions (when built)
Two cheap options — pick at build time:
- **Lightweight (preferred):** add columns to `Attempt`:
  `help_used` (none|walk_through|back_to_basics|show_solution; last/most-significant)
  and keep the existing `verdict == "skipped"`. The batch job reads these.
- **Eventful:** a `SkillSignal`/event table (`user_id, skill_id, kind, created_at`)
  if we want finer per-event history.

## Hooks already in place
- The three help buttons already exist in `PracticeScreen` (Walk me through it /
  Back up to basics / Show me the solution) and post canned messages — easy to tag.
- `verdict == "skipped"` already records skips on `Attempt`.

## Note: start logging early (optional, cheap)
The *analysis/report* is future, but the **trace is worthless if not collected from
the start**. When the schema is next touched (e.g. the modes redesign), consider
adding `Attempt.help_used` and recording which help button was tapped, so data
accrues before the report feature is built. The report/confirmation flow itself
stays future.

## Open questions
- Store only the "most significant" help action per attempt, or the full sequence?
- How many skips before we ask? (e.g. ≥3 skips, no correct attempt, in a window.)
- Where does the "confirm" question live — inside the report view, or as a nudge?
