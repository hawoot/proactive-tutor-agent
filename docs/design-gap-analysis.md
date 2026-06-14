# Tnejjem — Design Gap Analysis & Redesign Direction

_Researched 2026-06-13. Scope agreed with owner: **blank-slate rethink** of visuals, navigation, and flow. No implementation until a direction is chosen._

This document benchmarks Tnejjem against market-leading learning/productivity apps
(Duolingo, Brilliant, Imprint, Elevate, Peak, Khan Academy, Headspace, Finch, Rise,
Quizlet, Babbel, Oura), identifies why the current app reads as "a website from the
90s / a web app for phones," and recommends a direction. Every major claim is cited.

---

## 1. The gap — why it feels like a 90s website

The app is functional and the *palette* is actually thoughtful (warm sand by day,
night-sky dark mode). The problem is not colour. It's six concrete, fixable tells:

| # | What we do today | What the leaders do | Source |
|---|------------------|---------------------|--------|
| 1 | **Emoji as UI icons** (🏠📚📈⚙️🔥🎯) in tabs, stats, buttons | One consistent custom/SVG icon family (SF Symbols, Lucide, Phosphor) whose stroke weight matches the type. Emoji render differently per OS, can't match weight/colour, and read as a quick web build. | [NN/g icon usability](https://www.nngroup.com/articles/icon-usability/), [Apple HIG icons](https://developer.apple.com/design/human-interface-guidelines/foundations/icons), [native emoji struggle](https://nolanlawson.com/2022/04/08/the-struggle-of-using-native-emoji-on-the-web/) |
| 2 | **System font everywhere**, no real type scale | A characterful brand/display face + a clean workhorse, on a constrained modular scale. Duolingo = "Feather Bold" + DIN Round; Headspace = custom Aperçu; Khan = "Chalky"; Brilliant = CoFo Robert/Sans. | [Monotype/Duolingo](https://www.monotype.com/resources/duolingo-custom-font-inspired-their-owl-mascot-duo), [Duolingo type](https://design.duolingo.com/identity/typography), [Headspace type](https://www.itsnicethat.com/articles/italic-studio-headspace-graphic-design-project-250424) |
| 3 | **Stacked flat 1px-bordered cards** | Depth/elevation (or translucency) + large bold titles. Flat bordered rectangles are a *web-form* pattern, not iOS grouped/elevated cards or Material's depth-and-colour cards. | [iOS vs web feel](https://medium.com/design-bootcamp/designing-for-mobile-native-apps-vs-web-apps-106397823851), [2025 trends](https://www.apurple.co/mobile-app-design-trends/) |
| 4 | **Stock 4-tab bottom bar** as a menu of features | 3–5 tabs *for navigation only*; the daily action is ONE hero CTA on a "Today" home, not a tab. Duolingo collapsed everything into a single guided path. | [Duolingo path redesign](https://blog.duolingo.com/new-duolingo-home-screen-design), [Material bottom nav](https://m2.material.io/components/bottom-navigation), [NN/g mobile nav](https://www.nngroup.com/articles/mobile-navigation-patterns/) |
| 5 | **Almost no motion / feedback** | Spring-physics transitions, micro-interactions, haptics, confetti/checkmarks on wins, skeleton loaders instead of spinners. This is the single biggest "native vs web" tell. | [Material 3 Expressive motion](https://m3.material.io/styles/motion/overview/how-it-works), [NN/g skeletons](https://www.nngroup.com/articles/skeleton-screens/), [microinteractions](https://be-dev.pl/blog/eng/7-microinteractions-every-modern-app-should-use-in-2025) |
| 6 | **Static star mascot** that can't emote | Leaders use a *face* you can disappoint/cheer (Duo, Finch's bird) or go deliberately mascot-free with strong type. A geometric symbol carries the *name* but not the *engagement*. | [Duolingo mascot as "relationship vector"](https://blakecrosley.com/guides/design/duolingo), [Finch teardown](https://medium.com/@deepthi.aipm/ux-teardown-finch-self-care-app-18122357fae7) |

**The synthesis:** flat bordered cards + system font + emoji icons + no motion is
*literally the recipe for a web page rendered in a phone.* Fixing 1, 2, 3, and 5
would do most of the work even before any structural change.

---

## 2. Recommendations on the three decisions handed to research

### 2a. Navigation & flow — drop to a hub, not a menu

- **Make "Today" the home and the daily action the hero.** On open, ONE unmistakable
  CTA — *Start today's practice* — in the thumb zone, with streak/goal/next-up as a
  compact header strip above it (Duolingo path-header model), never as separate tabs.
- **Cut 4 tabs → 3** (e.g. **Today · Progress · Profile**), tabs for navigation only.
  Material says 3–5 top-level destinations; NN/g says tab bars break down past ~5.
- **Pre-select the session — don't make the user choose.** Surface one recommended
  practice as default (Elevate's auto-workout, Duolingo's linear path); "choose
  something else" stays secondary.
- **Protect the streak with a one-tap definition of "done."** Duolingo's experiment
  letting a single lesson keep the streak lifted 7-day-streak retention ~40%.
- **Watch the failure mode:** Finch/Headspace home screens get criticised for being
  *busy* — so it's "one action with strict visual hierarchy," not "cram it all in."

### 2b. Gamification — a humane, solo-appropriate minimal set

**Include:**
- **Streak, with a built-in safety net** (freeze / rest-day / "5 of 7 days" framing).
  Highest-evidence retention lever (Duolingo: visible streak ≈ +3% DAU, +1% D14), but
  add forgiveness to avoid documented "Duo anxiety" and all-or-nothing churn.
- **Adjustable daily goal** + occasional *variable* bonus (autonomy-supporting).
- **XP / mastery progress as a progress indicator** tied to real mastery (topics
  conquered, accuracy) — presented as a map, not a score to chase.
- **Milestone badges pegged to real learning** ("mastered Differentiation"), used
  sparingly and informationally (this is what supports intrinsic motivation).
- **Rich informational feedback** (why right/wrong) — the component most consistently
  linked to *durable* motivation. We already have this via the Socratic chat.

**Skip:**
- **Leagues / leaderboards** — require other concurrent users; impossible to do
  honestly in a solo app, and even with users they demotivate lower-ranked and
  intrinsically-motivated learners ([research](https://www.sciencedirect.com/science/article/abs/pii/S1041608024001651)).
- **Hearts / lives / "energy"** — punitive gating; frustrates users and *reduces*
  practice. Counterproductive for exam prep, where we want MORE attempts.
- **Guilt-trip notifications** — the "Duo anxiety" failure mode; 25–40-year-olds resent
  it most. Use gentle, optional nudges (which is already our proactive-scheduling moat).

**Principle:** lean on autonomy + competence signals + informational feedback; use the
streak as the *one* loss-aversion lever, kept humane. Stacking extrinsic/punitive
systems risks crowding out a student's actual interest in maths (overjustification
effect — [well established](https://en.wikipedia.org/wiki/Overjustification_effect)).

### 2c. Mascot — replace the static star with an expressive character, star-anchored

**Recommendation: a fennec fox companion, "premium-warm" not "kids-cute," keeping the
star as the brand's symbolic glue (the fox guides you toward your star/grade).**

Why, from the evidence:
- A static star can't do what mascots demonstrably earn — expressive feedback,
  push-notification personality, parasocial onboarding. Emotional stakes need a face
  you can disappoint/cheer. Nejma is a strong *name and story*, a weak *engine*.
- The fennec fox is a real North-African desert animal (authentic to the Tunisian
  story), and "fox = cleverness" is exactly the sophisticated-not-childish archetype
  recommended for adult learning. It localises better than an abstract symbol.
- **Closest analog: Brilliant** — an adult STEM app that *deliberately added* a mascot
  ("Koji") to "lower the stakes," paired with serious foundry type. Strong precedent
  that a character is not childish for serious learning.

**Hard conditions (do these or don't bother):**
- Tone = **Finch/Headspace** (encouraging, never punishing), NOT Duolingo guilt-trips.
  Exam-stressed teens resent guilt most.
- Pair with **grown-up typography + restrained palette** so the whole thing reads
  premium even with a character present.
- **Ship small:** ~5–6 expressions + a few poses first (cheap); only invest in a
  Rive/Lottie animated rig once retention justifies it.

**Alternatives if conditions can't be met:**
- *Keep the star* — lowest cost, lowest engagement ceiling; fine if leaning B2B/parent
  trust where a calm symbol + type reads credible (Khan/Oura model).
- *Mostly mascot-free* — safest "looks expensive / premium-serious" route, best
  localisation safety, but forfeits the parasocial onboarding/notification advantage.

---

## 3. Three visual directions to choose between (the "show me")

The owner deferred tone with "show me," so these are written to be mocked up and
reacted to, not decided abstractly.

**A — Bold & Playful (the Duolingo direction).**
Loud saturated colour and rounded shapes, a friendly mascot that reacts and guides,
confetti everywhere, exclamation-mark encouragement. Makes learning feel like a game.
Best for casual, broad-audience habit apps where daily return is the whole battle.
_Risk for us: can read as a kids' app to exam-serious 16–19s and their parents._

**B — Calm & Premium (the Headspace / Oura direction).**
Lots of breathing room, soft warm/muted palette, one or two restrained accents, gentle
motion, big quiet typography, minimal clutter. Feels expensive, trustworthy, unhurried.
Best where the user should feel relaxed and in control.
_Risk for us: can feel under-energised for a daily practice/quiz loop that benefits
from a bit of momentum and celebration._

**C — Bold & Editorial (the Brilliant / Linear direction).**
Confident large typography as the hero, tight geometric/line illustration, strong
grid/bento layouts, crisp high-contrast surfaces, precise (not bouncy) motion. A
character can appear but stays subtle. Reads modern, intelligent, design-forward.
Best for curious learners who want substance with style, not cheerleading.

**My lean: a C-base with A's warmth — "Bold & Modern with a warm fox."**
This is essentially the Brilliant playbook, which is the closest real analog to us
(adult STEM, serious type, a deliberately-added encouraging character). It keeps the
app feeling smart and exam-credible while the fox + humane gamification supply the
daily-habit pull. B's restraint informs the spacing and calm, A's celebration moments
show up only at genuine wins.

---

## 4. Top 5 highest-leverage changes to kill the "90s website" feeling

1. **Ship a custom icon set; ban emoji from UI chrome.** One SVG family (Lucide or
   Phosphor) via `react-native-svg`, stroke weight matched to the type. Cheapest,
   highest-impact single change. (Migrate off the deprecating `@expo/vector-icons`.)
2. **Adopt a brand typeface + a locked type scale.** A display face for headlines/brand
   + a clean rounded workhorse for UI/body; ~5–6 sizes on a 1.2–1.25 ratio, 2–3 weights.
   Embed via `expo-font` config plugin (no flash-of-unstyled-text).
3. **Replace flat bordered cards with depth + real hierarchy.** Elevation/soft shadows
   or translucency, large bold titles, generous whitespace. Kill the 1px web-form look.
4. **Add motion + haptics.** Spring transitions (`react-native-reanimated`/Moti),
   `expo-haptics` on key taps, Lottie confetti/checkmark on wins, skeleton loaders
   instead of spinners for loads >1s. This is the biggest native-vs-web tell.
5. **Rebuild the home as one hero action + 3 tabs.** Today screen = single *Start
   practice* CTA with streak/goal as a header strip; tabs cut to Today · Progress ·
   Profile, navigation only.

---

## 5. RN/Expo implementation notes (for when we build)

- **Icons:** `lucide-react-native` or `@react-native-vector-icons/*` (+ Expo config
  plugin); render as SVG, inherit `currentColor`. Phosphor if we want multiple weights.
- **Fonts:** `expo-font` config plugin (build-time embed) for ttf/otf.
- **Animation:** `react-native-reanimated` (foundation, UI-thread), `moti` (declarative
  wrapper), `lottie-react-native` (vector celebrations), `expo-haptics`.
- **Loading:** skeleton components matching each screen's layout; spinners only for
  short discrete actions; neither under ~1s.
- **Platform feel:** large titles + grouped cards (iOS), depth + colour + grids
  (Android/Material 3 Expressive). Matching one of Liquid Glass / M3 Expressive signals
  "2025-era native"; matching neither signals dated.

---

## 6. Open question for the owner

Which of the three directions (A / B / C) — or the recommended **C-base + warm fox**
hybrid — should be turned into visual mockups to react to before any code is written?

---

## 7. Update — 2026-06-14 (decisions after first mockups)

**Direction chosen:** **C, warmed** ("Bold & Editorial, warmed"). Next step = polish
this direction before any code. Variants to lock: night/day (the app has both) and the
accent colour (amber-gold recommended vs the original terracotta).

### 7a. Kill the native pop-ups — make confirmations part of the themed flow
The app currently uses the OS-native `Alert.alert` for several flows. These render as
system dialogs that ignore the app's theme entirely — a major "off-brand / unpolished"
tell, separate from the six in §1. Replace **all** of them with in-app, themed UI
(the existing `Sheet` bottom-sheet component, themed action rows, or inline buttons —
which is exactly how the mockups already render "Skip / choose next").

Known offenders to replace:
- `PracticeScreen.js` — `dismissOpen`/`chooseNext` ("Skip — what next?", "Another
  question") and `attachPhoto` ("Photo of your work"). → themed bottom sheet or inline
  action chips (mockups already show inline `Hint / I'm stuck / Show me` + a skip chip).
- `TodayScreen.js` — `dismissOpen` ("Skip this question?"). → inline on the hero card.
- `SettingsScreen.js` — any confirm/destructive `Alert.alert` (e.g. reset/seed). →
  themed confirm sheet.
Principle: **no OS dialog should appear in a normal flow.** Reserve native alerts only
for true OS-permission denials. Confirmations, choices, and "what next?" are in-app.

### 7b. Brand pivot — unify everything under **Labib (لبيب)**, the fennec
Decision in progress (owner-led): drop the split `Tnejjem` (app) / `Nejma` (star
mascot) identity and **unify the app name AND mascot as "Labib"** — the fennec fox.

Why this is strong:
- **Labib (لبيب) literally means "intelligent / wise / sagacious"** — on-the-nose
  perfect for a tutoring app, in a way a star never was.
- It **converges with this report's mascot recommendation (§2c)**: a fennec fox,
  culturally rooted, "clever animal" archetype that reads sophisticated-not-childish.
- **Distinctly Tunisian with built-in story & nostalgia:** Labib is the beloved fennec
  mascot Tunisians grew up with (national environmental campaign, since ~1993). Instant
  recognition and warmth for the home audience.
- Unifying name = mascot is simpler and stronger branding than the Tnejjem/Nejma split,
  and removes the "unfinished brand" open thread.

**One real consideration to handle (flagged, not a blocker):**
- The original Labib is a **state-associated national mascot** (Tunisia's environment
  agency). The *name* and the *fennec idea* are fair to adopt, but we should **design an
  ORIGINAL fennec character** (our own proportions, palette, expressions — as in the
  mockups) rather than replicate the official Labib's specific design/livery. This both
  avoids IP/likeness issues and lets us own a distinct brand asset. **Verify trademark
  availability before any public app-store launch.**
- Story shifts cleanly: *Labib, the wise desert fox who guides you to mastery.* The
  "reach for the star / you can" sentiment can survive as a motif (the fox reaching a
  star = your target grade) without needing the Tnejjem/Nejma names.

**Implication:** a rename touches the app name, icon, and splash, which are baked into
the native binary → this requires a **full EAS rebuild** (not an OTA update), per the
project handoff. Worth doing once, alongside the redesign, not piecemeal.

### 7c. Flow redesign — "solve first, decide less"
Owner's diagnosis (the key one): *"most of your mental energy is used before you even
start solving."* The app front-loads decisions. **Governing principle: spend energy
solving, not deciding — the agent makes the calls, the student just answers.**

Current loop (from `App.js` / `TodayScreen.js` / `PracticeScreen.js`) and its friction:
- Practice is a **modal** you drop into and bounce out of — the core activity has no home.
- **Quick vs Deep is asked repeatedly** — on Today, on every skip, on every "next" — and
  those are the off-theme `Alert.alert` pop-ups (see §7a). Decision tax + ugly UI.
- New users take **5+ taps** to reach the first coached question (onboard → Today →
  "pick a course" → Courses → enroll → back → practice). The "aha" is buried.
- The hero card **shifts identity** (open question / reviews due / caught up), blurring
  "what does today want from me, and when am I done?"

Proposed loop (all four frictions, owner confirmed all four bite):
1. **One tap to solving.** The nudge and Today's single primary button drop you straight
   into a question the agent already chose. **Onboarding ends *inside* the first coached
   question** (enrollment happens during onboarding), so the magic moment is immediate.
2. **Quick vs Deep — kept, friction removed.** It's a real need (a 2-min moment ≠ a
   sit-down). Make it a **quiet, sticky toggle** the agent pre-sets from context (quick
   nudge → Quick; study session → Deep). It lives in the session header; one tap to flip,
   and it **stays** for subsequent questions. **Never a pop-up, never asked twice.** Skip
   = one tap, moves on in the current mode. → removes essentially all the §7a dialogs.
3. **A clear daily target.** One stable goal (e.g. "3 of 5") and one consistent action.
   Reviews-due / exam-countdown move to a secondary line, not the primary button. A real
   **"done for today"** finish line (streak ticks, gentle non-nagging "one more?").
4. **Practice as a continuous session, not a modal.** Slim progress strip ("2 / 5") at
   top; "next" flows in inline; exiting returns you to a Today that reflects what you just
   did. Keep full-screen focus, lose the bounce-in/bounce-out feel.

Answer modalities (type / talk / snap photo) are unchanged — that part already works.

**Help buttons (in-session quick replies) — reduced from 3 to 2.** Today's set is
Hint / I'm stuck / Show me. "I'm stuck" is a *state*, not an action (the tutor can infer
it), and a plain "Hint" is subsumed by guided mode. Replace with the two that span the
whole range:
- 🧭 **Walk me through it** — scaffolded, step-by-step; the student still does the work.
  It *opens with a hint* (the first nudge) and guides only as much as needed → this is the
  pedagogically strongest path and the encouraged/primary button.
- 👁 **Show me the solution** — the escape hatch: full worked answer.
The free-text box is always present, so direct answers or any other question need no
button. (Post-answer follow-ups — Explain more / Similar example — stay.)

Visual references: `mockups/labib-flowmap.png` (flow), `mockups/labib-session.png`
(redesigned session: sticky toggle, progress strip, two help buttons, inline verdict +
inline next, real finish line), `mockups/labib-firstrun.png` (onboarding → first coached
question). With look, brand, mascot, and flow now all defined, the redesign is ready to
build.
