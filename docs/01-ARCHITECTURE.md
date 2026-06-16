# Architecture

## Monorepo layout

```
readme-app/                      ← npm workspaces root
├── apps/
│   ├── mobile/                  Expo / React Native (primary client)
│   └── web/                     Vite / React DOM (web client)
├── packages/
│   └── shared/                  Cross-app code (auth, theme, constants)
├── functions/                   Firebase Cloud Functions (Node) — empty for now
├── firestore.rules              Security rules
├── firestore.indexes.json       Composite indexes
└── firebase.json                Firebase project config
```

`apps/*` and `packages/*` are workspaces — `npm install` at the root links them.

## What lives where

| Concern | Location |
|---------|----------|
| Native screens, navigation | `apps/mobile/src` |
| Web pages, router | `apps/web/src` |
| Firebase init, auth service | `packages/shared/src/services` |
| Theme colors, fonts, spacing | `packages/shared/src/constants/theme.ts` |
| Route name constants | `packages/shared/src/constants/routes.ts` |
| Role / status / visibility enums | `packages/shared/src/constants/authConstants.ts` |
| `useAuth()` provider | `packages/shared/src/contexts/AuthContext` |
| Security rules | `firestore.rules` |
| Server logic (later) | `functions/` |

## Request flow

```
            ┌──────────────────────────┐
            │  apps/mobile (RN/Expo)   │
            │  apps/web    (Vite/DOM)  │
            └────────────┬─────────────┘
                         │ Firebase JS SDK
                         ▼
            ┌──────────────────────────┐
            │ Firebase Auth            │  ← email/password + Google + email verify
            └────────────┬─────────────┘
                         │
                         ▼
            ┌──────────────────────────┐
            │ Firestore                │  ← users/{uid}, future /events, /books…
            │  gated by firestore.rules│
            └──────────────────────────┘
```

Both clients talk directly to Firebase. There is no custom backend in front
of Firestore today; the security rules are the boundary. Cloud Functions
will eventually hold any server-only business logic (admin ops, moderation).

## Platform-specific code in `packages/shared`

Two files have native-only imports and need a web counterpart:

| File | Mobile entry | Web entry |
|------|--------------|-----------|
| `services/firebase.js` | `firebase.native.js` | `firebase.web.js` (uses `browserLocalPersistence`) |
| `services/auth.js` | `auth.native.js` (Google via `@react-native-google-signin`) | `auth.web.js` (Google via `signInWithPopup`) |

Shared bits (email/password flows, `saveUserData`, password reset, sign-out)
live in `auth.shared.js` and both platforms re-export from it.
