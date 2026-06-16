# Local setup

## One-time

| What | How |
|------|-----|
| Node 20 LTS | install from nodejs.org |
| Git long paths (Windows) | `git config --global core.longpaths true` |
| Firebase project access | ask Gonçalo — he adds you to the Firebase console |
| Expo Go (iOS/Android) | install from App Store / Play Store, for mobile testing |
| Android Studio (optional) | only if you want the Android emulator |
| Xcode (macOS only) | required for iOS native builds |

## Clone

```bash
git clone https://github.com/barrosgoncalo/readme-app.git
cd readme-app
git switch -c feat/<your-slice>-<your-name>   # never work on main
npm install                                    # installs all workspaces
```

## Run mobile

```bash
cd apps/mobile
npx expo start
# scan the QR with Expo Go, or press 'a' (Android) / 'i' (iOS) / 'w' (web preview)
```

## Run web

```bash
cd apps/web
npm run dev
# Vite serves at http://localhost:5173 by default
```

## Env vars

### Mobile (`apps/mobile/.env` — already in repo)
Mobile uses `EXPO_PUBLIC_*` prefix so Expo bundles them into the client.

```
EXPO_PUBLIC_FIREBASE_API_KEY=…
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=…
EXPO_PUBLIC_FIREBASE_PROJECT_ID=…
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=…
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=…
EXPO_PUBLIC_FIREBASE_APP_ID=…
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=…
```

### Web (create `apps/web/.env.local` — gitignored)
Vite uses `VITE_*` prefix. Copy `apps/web/.env.example` and fill in real values
from Gonçalo (Firebase Console → Project settings → SDK setup → Web).

```
VITE_FIREBASE_API_KEY=…
VITE_FIREBASE_AUTH_DOMAIN=…
VITE_FIREBASE_PROJECT_ID=…
VITE_FIREBASE_STORAGE_BUCKET=…
VITE_FIREBASE_MESSAGING_SENDER_ID=…
VITE_FIREBASE_APP_ID=…
VITE_FIREBASE_MEASUREMENT_ID=…
```

**Never commit `.env.local`.** It's already gitignored. Same goes for any
Firebase Admin service-account JSON — those belong on the server, not in the repo.

## Firestore emulator (optional, recommended)

```bash
npm install -g firebase-tools
firebase login
firebase emulators:start --only firestore,auth
# UI at http://localhost:4000
```

Wire the client to the emulator by setting `connectFirestoreEmulator` and
`connectAuthEmulator` calls in `firebase.web.js` / `firebase.native.js`,
gated on a dev-only flag.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `npm install` slow / wrong | delete `node_modules` and root `package-lock.json`, re-run |
| Mobile build "FileNotFoundException ios/" | Windows long paths — run `git config --global core.longpaths true`, reclone |
| Web `import 'firebase/auth'` fails | `npm install firebase` inside `apps/web` |
| `useAuth() is undefined` | wrap your component tree in `<AuthProvider>` |
| Email verification email never arrives | check spam; Firebase Console → Auth → Templates → make sure the sender domain is set |
