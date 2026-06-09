# Proactive Tutor Agent

An exam-aware, **proactive** tutoring agent. The moat is not explanation (any LLM
does that) - it is **scheduling: deciding when/whether/how to prompt the learner**,
plus curated unit-tree material. The agent chases the learner.

## Repo map

```
backend/   FastAPI + SQLite + scheduler + provider-agnostic LLM   -> backend/HOWTO.md
mobile/    Expo (React Native) app, iOS + Android, push-ready     -> mobile/HOWTO.md
```

Each half is independent: the backend runs and is testable with curl alone; the
mobile app is a thin client over the backend's HTTP API.

## Architecture in one breath

- **Engine vs curriculum**: the engine (memory, scheduling, mastery, delivery) is
  invariant; a subject is just data (a `program` + skill graph + unit tree).
- **LLM vs state**: the LLM is a swappable brain behind `backend/app/llm/`
  (Anthropic, OpenAI, DeepSeek, local - one env switch). The tutor that "grows"
  is the accumulated state in the DB, never a process or a model.
- **Stateless workers, stateful system**: every trigger loads state -> acts -> persists.
- **Deterministic core, LLM at the edges**: the scheduler (ticker -> fence -> decide ->
  phrase -> notify) is owned, tunable code; the LLM only phrases and marks.
- **Channel-agnostic**: notifications go through a `Notifier` interface
  (Console / Telegram / Expo push); inbound transports normalise to one event.

## Phases

0. (now) backend + one program, self-use; mobile v0 talking to it on your LAN/VPS
1. real push via a dev build; public-domain content (Gutenberg-safe)
2. payments, more programs
3. (maybe) third-party publishing; buy-your-own-copy uploads

Design for 3; build 0.
