# mobile/HOWTO - from zero (never done mobile dev before)

The app runs on YOUR phone via **Expo Go** - no Mac, no Xcode, no App Store,
no Android Studio. Your laptop serves the app; your phone loads it over Wi-Fi.

## 0. One-time setup

1. **Laptop**: install Node.js 20+ from https://nodejs.org (check: `node --version`).
2. **Phone**: install the free **Expo Go** app from the App Store / Play Store.
3. Laptop and phone on the **same Wi-Fi network**.

## 1. Run the app

```bash
cd mobile
npm install              # downloads dependencies (first time: a few minutes)
npx expo install --fix   # aligns native package versions with the Expo SDK
npx expo start           # starts the dev server, prints a QR code
```

- **iPhone**: open the Camera app, point at the QR code, tap the banner.
- **Android**: open Expo Go, tap "Scan QR code".

The app loads in a few seconds. Edit any file under `mobile/` and it hot-reloads
instantly on the phone.

> QR won't connect? Some networks block device-to-device traffic. Run
> `npx expo start --tunnel` instead (routes through Expo's servers, slower but
> always works).

## 2. Connect it to your backend

The backend must be running first (see `../backend/HOWTO.md`).

In the app, go to the **Settings** tab:

1. **Backend URL**: `http://SERVER_IP:8000` (with `http://`, no trailing slash).
2. **API key**: the `API_KEY` value from `backend/.env` (empty if you didn't set one).
3. **User ID**: `1`.
4. Tap **Save & test connection** -> "backend reachable ✓".
5. Tap **Seed demo data** once -> creates the A-level Maths demo program and user 1.

## 3. The four tabs

- **Today** - the practice loop. Shows the open question (whether the agent
  nudged you or you pulled one). Answer it, get marked by the LLM, see feedback.
  Pull a *quick* (phone-friendly) or *deep* (pen-and-paper) question on demand.
- **Library** - the content manager. Shared programs vs your personal ones.
  Tap a program to: **enroll** (the agent starts chasing you), set an **exam date**
  (nudges intensify as it approaches), browse the unit tree, and - on programs you
  own or shared ones - **add/edit/delete units and skills**. Attach private **notes**
  to any unit (only you see them). **Clone** any shared program into your personal
  space to customise it freely.
- **Progress** - per-skill mastery bars for each enrollment, next-review dates,
  and your recent attempt history.
- **Settings** - connection, push registration, and your tutor preferences:
  timezone, quiet hours (no nudges then), max nudges per day.

## 4. Push notifications (the "proactive" part on your phone)

Inside Expo Go push is limited (Android: unsupported). For real push, build a
development version of the app once:

```bash
npm i -g eas-cli
eas login                 # free Expo account
eas build --profile development --platform android   # or: ios
```

Install the build from the link Expo gives you, reopen the app, then in
**Settings** tap **Enable push notifications**. The backend is already wired -
scheduled nudges now arrive as real notifications.

Until then, nudges still happen - you see them as the open question on the
Today tab (and in the backend logs).

## 5. Where things live

```
App.js                 navigation shell (4 tabs)
src/api.js             the ONLY file that knows the backend (all endpoints)
src/push.js            push registration
src/theme.js           colours/spacing
src/components.js      shared UI (buttons, cards, editors' bottom sheet...)
src/screens/           one file per screen
```

## 6. If it doesn't connect

- Same Wi-Fi? URL has `http://` and the right IP/port? No trailing slash?
- Is the backend actually up? On the server: `curl localhost:8000/health`.
- Port 8000 reachable from outside? (container/host firewall)
- 401 errors -> the API key in Settings doesn't match `API_KEY` in `backend/.env`.
- "Unknown user 1" -> tap **Seed demo data** once (or create a user via the API).
