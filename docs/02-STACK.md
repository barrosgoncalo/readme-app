# Stack

## Versions (pinned in package.json)

| Layer | Choice | Version |
|-------|--------|---------|
| Node | LTS | ≥ 20 |
| React | both apps | 19.2 |
| Mobile runtime | React Native | 0.83.6 |
| Mobile platform | Expo SDK | 55 |
| Web bundler | Vite | 8 |
| Backend SDK | Firebase JS SDK | ^12 |
| Cloud Functions runtime | Firebase Functions v2 | latest |

> `AGENTS.md` says "Expo HAS CHANGED — read v56 docs." Package.json pins 55.
> Confirm with the team which is current before bumping.

## Mobile libraries (apps/mobile)

| Package | Purpose |
|---------|---------|
| `@react-navigation/native` v6 | Routing |
| `@react-navigation/native-stack` v6 | Stack navigator |
| `@react-navigation/bottom-tabs` v6 | Bottom tabs |
| `@react-native-async-storage/async-storage` | Auth persistence + first-launch flag |
| `@react-native-google-signin/google-signin` | Native Google sign-in |
| `expo-camera` | Barcode scan (planned) |
| `expo-location` | Location for events map |
| `expo-splash-screen` | Splash control |
| `react-native-maps` | Maps |
| `phosphor-react-native` | Icons |
| `@expo-google-fonts/inter` + `…/playfair-display` | Custom fonts |

## Web libraries (apps/web — being added)

| Package | Purpose |
|---------|---------|
| `react-router-dom` v6 | Routing |
| `firebase` | Firebase JS SDK |
| `@readme/shared` | Workspace package (constants, auth context) |

Web Google sign-in uses `signInWithPopup` from `firebase/auth` (no extra lib).

## Shared (packages/shared)

Plain TypeScript / JavaScript. No React Native–only deps at the root —
platform-specific imports are isolated in `.native.js` / `.web.js` files.

## Why this stack

- **Firebase** — gets us Auth, Firestore, Functions, Storage, and Hosting on
  one bill. Email verification + Google OAuth are free.
- **Expo** — managed RN, OTA updates, easy native module integration.
- **Vite** — fast web dev server, first-class React 19 support, simple env-var story.
- **Monorepo** — one place for shared constants + the auth contract,
  keeps mobile and web in sync.
