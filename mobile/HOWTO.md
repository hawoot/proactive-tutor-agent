# mobile/HOWTO

The app runs on YOUR phone via Expo - no App Store needed.

## Run it

```bash
# laptop: Node 20+ required          phone: install "Expo Go" from the store
cd mobile
npm install
npx expo install --fix
npx expo start
```
Scan the QR with your phone (same Wi-Fi; if blocked: `npx expo start --tunnel`).

## Connect it

1. Backend must be running (see ../backend/HOWTO.md).
2. App -> **settings** tab:
   - Backend URL: `http://VPS_IP:8000`
   - Student ID: `1`
   - **Save & test connection** -> "backend reachable"
   - **Seed demo data** (once)
3. **practice** tab -> question -> answer -> marked feedback.
   **progress** tab -> per-skill mastery bars.

## Push notifications

- Limited inside Expo Go (Android: unsupported). For real push, build once:
  ```bash
  npm i -g eas-cli && eas login
  eas build --profile development --platform android   # or ios
  ```
  Install from the link, reopen, tap **Enable push notifications**.
  Backend side is already wired (`ExpoPushNotifier`).

## Where things live

`App.js` = 3 screens. `src/api.js` = the only file that knows the backend.
`src/push.js` = push registration.

## If it doesn't connect

Same network? Port 8000 open on the VPS? URL has `http://` and no trailing slash?
