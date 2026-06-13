# Tnejjem — project handoff / context

_Last updated: 2026-06-13._

---

## 1. What this is

**Tnejjem** is a proactive mobile tutoring app. The moat is **proactive scheduling**: it reminds you to practise at times you choose, serves one adaptively-chosen question (spaced repetition + weakest-first), and lets you answer by **typing, talking, or photographing handwritten working**. Mascot: **Nejma** (star). ("Tnejjem" = Tunisian for "you can"; "Nejma" = star — same root.)

Exam-aware: scheduling + curated unit-tree content. UK A-level Maths curriculum seeded: ~58 skills, ~116 curated questions with model answers. Questions come from the curated bank or are LLM-generated, per enrollment policy.

**Build history (most recent first):**
- **v3.2.0 — Camera + mic answers (native rebuild).** Photo of handwritten work → marked by Claude vision; on-device speech dictation fills the answer box.
- **UI polish pass** — soft shadows, rounded chat composer.
- **Notifications re-architected to device-local** (see §3).
- **Scheduler reworked** to specific clock times the user picks; draggable goal slider; inline skip (quick/deep); tappable history reopens past conversation.
- Earlier: full DB redesign, CRUD API, question bank, Socratic coaching → mark, Today timeline home screen, onboarding.

---

## 2. Architecture

```
  Phone (Expo / React Native)                  Backend (FastAPI)
  ──────────────────────────────────           ──────────────────────────
  • Today / Practice / Courses /               • /today, /practice/*, /users,
    Progress / Settings screens                  /enrollments, /programs, /progress…
  • Reminders: scheduled LOCALLY               • SQLAlchemy + Alembic (migrations
    by OS from user's chosen times               auto-run on startup)
    (offline, no server) — src/notifs.js       • SQLite (tutor.db) by default;
  • Answers: type / voice (on-device STT) /      Postgres via DATABASE_URL
    photo (base64 → backend → Claude vision)   • LLM provider abstraction
  • Backend URL + API Key set in                 (app/llm/): anthropic (default,
    Settings screen                              claude-sonnet-4-6), openai_compat,
                                                 or fake (offline tests)
                                               • NO push-delivery scheduler thread
                                                 (removed)
```

**Repo:** `hawoot/proactive-tutor-agent`
- Work branch: **`claude/backend-config-docs-t6fwsx`** (current); was `claude/app-redesign-database-vd6rrn`.
- Each push → PR → auto-merges to `main`.
- **Backend:** `backend/` (FastAPI under `backend/app/`). Tests: `cd backend && python -m pytest`.
- **Mobile:** `mobile/` (Expo SDK 53). Entry `App.js`; screens `mobile/src/screens/`; shared UI `mobile/src/components.js`; design tokens `mobile/src/theme.js`; backend client `mobile/src/api.js`.
- **Deploy helpers:** `deploy/` — `container.sh`, `docker-compose*.yml`, `AGENT_PROMPT.md`.

---

## 3. How notifications work

Reminders are **local notifications scheduled by the phone OS** from user-chosen times (`mobile/src/notifs.js`, `syncReminders(times)` with WEEKLY triggers). Fire offline, app closed, **no server involved**. The old server-push outbox (background thread → queue → Expo push token) was deleted.

- Banner is generic ("Time to practise"); the **specific question is fetched from the backend when the user taps and the app opens**.
- Chosen times are also synced to the backend (best-effort, for persistence); firing is purely device-side.
- **Future push (if needed):** APNs/FCM as an additive layer for server-decided smart nudges. Local remains the reliable baseline.

---

## 4. Build & deploy

### Mobile (EAS)
- **EAS project:** owner `hawoot`, slug `proactive-tutor`, projectId `3bdd17d3-b6e4-4802-91de-9a02031614fb`. Channel/profile: **`preview`** (internal APK). Runtime version = `version` in `mobile/app.json` (currently **3.2.0**).
- **OTA update (JS-only):** `eas update --channel preview` → installed apps pick it up on next launch. No reinstall.
- **Full rebuild (native changes — new modules, permissions, icon/name):** `eas build --platform android --profile preview` → new APK. Bump `version` in `app.json` first. Verify with `npx expo-doctor` and `npx expo export --platform android` before triggering.
- Rule: **added/removed an `expo-*` / native package or a permission → rebuild. Otherwise → OTA.**
- Auth: `EXPO_TOKEN` env var (see §5).

### Backend
- Deployed on **Hermes** (the user's host agent — see §6).
- Upgrade = `git pull` + restart. Alembic migrations run automatically on startup.
- `deploy/container.sh {start|stop|status|logs}` manages the single process (API + embedded scheduler). PID: `backend/tutor.pid`. Log: `backend/tutor.log`.

---

## 5. Credentials ⚠️ KEEP PRIVATE

| What | Value |
|------|-------|
| **Backend URL** | `https://exposed-port-8000-ec47f581055d59b87223-3upcvdxuqf.h65.openclaw.agent37.com` |
| **Backend API Key** (`X-API-Key` header) | `39f6c9aca5e3d8df7e5a228371ac690220a62386915e7313` |
| **EXPO_TOKEN** | `b1K2xfY6wwQdK4LyRX5babU59ujG8__RPFU_7iJO` |
| **LLM API Key** | In `backend/.env` as `LLM_API_KEY` or `ANTHROPIC_API_KEY` on the host. Not in repo. |

`export EXPO_TOKEN=…` before any `eas-cli` command in a fresh session.

---

## 6. Hermes — the host agent

**Hermes** is an AI agent with shell access to the backend host. It is how we act on the server.

**Workflow:** when a backend host action is needed (deploy, debug, backup, etc.), this session produces a **self-contained Hermes prompt** that the user copy-pastes to Hermes. Ready-made prompts are in `deploy/AGENT_PROMPT.md`:

| Prompt | Use |
|--------|-----|
| **A — First deploy / redeploy from scratch** | Fresh container or wiped host |
| **B — Update to latest code** | After any push to main |
| **C — Health check / debug** | When something seems wrong |
| **D — Backup the database** | Before risky changes |

When I need a custom Hermes action not covered above, I will write a full self-contained prompt block in my reply for you to hand off.

---

## 7. Quick commands

```bash
# Backend tests
cd backend && python -m pytest -q

# Mobile: verify before shipping
cd mobile && npx expo-doctor && npx expo export --platform android

# Mobile: OTA update (JS-only changes)
export EXPO_TOKEN=b1K2xfY6wwQdK4LyRX5babU59ujG8__RPFU_7iJO
cd mobile && npx eas-cli update --channel preview --message "…" --non-interactive

# Mobile: full rebuild (native changes — bump app.json version first)
cd mobile && npx eas-cli build --platform android --profile preview --non-interactive

# Backend: give to Hermes (see deploy/AGENT_PROMPT.md prompt B)
# git pull + restart + health check
```

---

## 8. Open threads

- **Photo answer marking** — the vision code is deployed; the backend needs a redeploy via Hermes (prompt B) to activate it.
- **Branding decision** — current Tnejjem/Nejma feels unfinished. Three candidate directions (each a real story, not a pun):
  1. **Fennec fox** desert companion ← recommended; most story-forward, authentically Tunisian
  2. **Star that lights up** as you master skills (constellation = progress map)
  3. **Lantern** that leads you through the unknown
  Picking one requires a **full rebuild** (name/icon/splash are baked into the binary).
- **Bolder UI pass** — v3.2.0 still feels similar to before; a more distinctive visual treatment is welcome.
