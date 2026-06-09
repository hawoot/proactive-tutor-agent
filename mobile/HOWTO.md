# mobile/HOWTO

The app is a thin client over the backend's HTTP API. You develop it on your
laptop and run it **on your actual phone** via Expo - no App Store involved.

Jargon decoder (the three ways an app gets onto a phone):
- **Expo Go** - a free app from the store that runs your JS instantly. Fastest
  dev loop; some native features limited.
- **Dev build** - YOUR app, compiled in Expo's cloud (EAS), installed on your
  phone via a link/QR. Full native features incl. real push. No store review.
- **Store release** - only when strangers need to install it. Much later.

## 1. Prerequisites

`[LAPTOP]`
```bash
node --version    # need Node 20+. If missing: install from nodejs.org (LTS)
```
On your **phone**: install the "Expo Go" app (App Store / Play Store).

## 2. Install & start

`[LAPTOP]` - from the repo root:
```bash
cd mobile
npm install
npx expo install --fix   # aligns native package versions with the Expo SDK
npx expo start
```
A QR code appears in the terminal.

**Phone and laptop must be on the same Wi-Fi.** Scan the QR with the camera
(iPhone) or from inside Expo Go (Android). The app loads on your phone; edits
to the code hot-reload instantly.

If the QR won't connect (corporate Wi-Fi etc.): `npx expo start --tunnel`.

## 3. Point it at the backend

Have the backend running first (see ../backend/HOWTO.md) with
`--host 0.0.0.0` so it listens beyond localhost.

In the app -> **settings** tab:
- Backend URL: `http://<your-laptop-LAN-IP>:8000`
  (`[LAPTOP]` find the IP: `ipconfig getifaddr en0` on macOS, `hostname -I` on Linux.
   NOT `localhost` - on the phone, localhost means the phone itself.)
  If the backend lives on the VPS instead: `http://agent37-ip:8000` or your domain.
- Student ID: `1`
- Tap **Save & test connection** -> expect "backend reachable"
- Tap **Seed demo data** once.

Then the **practice** tab: Give me a question -> answer -> marked feedback.
The **progress** tab shows per-skill mastery filling up as you answer.

## 4. What v0 contains

- `App.js` - three screens (practice / progress / settings), plain React state,
  no navigation library yet (add expo-router when screens multiply).
- `src/api.js` - the ONLY file that knows the backend; URL stored on-device.
- `src/push.js` - push permission + token registration against /register_device.

## 5. Push notifications - the honest caveats

- Push needs a **physical device** (never a simulator).
- In **Expo Go**, push is limited (notably unsupported on Android since SDK 53).
  The button may work on iOS in Expo Go; treat it as a preview.
- For REAL push - the product's whole point - make a **dev build** once:
  ```bash
  npm install -g eas-cli
  eas login            # free Expo account
  eas build --profile development --platform android   # or ios
  ```
  Install the built app from the link Expo gives you, run `npx expo start`
  again, open the dev build. Now "Enable push notifications" registers a real
  token, and the backend's scheduler nudges land on your phone.
- Server side: nothing extra - `ExpoPushNotifier` in the backend already sends
  via Expo's push service once a token is registered.

## 6. Troubleshooting

- "Backend NOT reachable": same Wi-Fi? Backend started with `--host 0.0.0.0`?
  Firewall on the laptop blocking port 8000?
- Version warnings on `expo start`: run `npx expo install --fix`.
- Stuck cache: `npx expo start -c`.
