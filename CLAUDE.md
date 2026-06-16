# README App — Project Memory (ADC Course Project)

> ⚠️ **This is the active repo** (`barrosgoncalo/readme-app`). An earlier exploration
> in `ManuelOliveiraAnao/readme-app` used a different stack (Java/Jersey + GCP App
> Engine) — that's obsolete. Everything below describes what's actually in this repo.

## What this project is

**README** is a community platform for book lovers, built as the ADC (Aplicações
Distribuídas na Cloud) course project at NOVA FCT. Team of 4 people.

Core features (per the brief): user accounts with roles, book-themed events,
catalog + exchange, gamification (coins), location/map, realtime chat.

## Hard rules

- 🚫 **Never push directly to `main`.** All work goes on a feature branch.
- 🚫 **Never open a PR or merge** without the user's explicit OK after a team meeting.
- ✅ Branch naming: `feat/<slice>-<owner>` (e.g. `feat/setup-anaom`).
- ✅ Anything that touches Firestore data, security rules, or Cloud Functions
  must be discussed with the team before deploy — Firebase changes affect everyone.

## Architecture (decided by the team)

**Expo + Firebase monorepo (mobile-first).** Not GCP App Engine.

| Layer | Choice |
|-------|--------|
| Repo layout | npm workspaces: `apps/mobile`, `apps/web`, `packages/shared`, `functions/` |
| Mobile | React Native 0.83.6 + **Expo SDK 55** + React 19 |
| Web | Minimal Vite scaffold (essentially untouched) |
| Backend | **Firebase Cloud Functions** (currently empty boilerplate in `functions/index.js`) |
| Database | **Firestore** (Firebase SDK, not Admin SDK from App Engine) |
| Auth | **Firebase Auth** — email/password + verification + **Google Sign-In** |
| Navigation | React Navigation v6 (native stack + bottom tabs) |
| Maps | `react-native-maps` |
| Camera/scan | `expo-camera` (ScannerScreen placeholder) |
| Icons | `phosphor-react-native` |
| Theming | Extracted constants + dark/light mode |

`AGENTS.md` in the repo says "Expo HAS CHANGED. Read the exact versioned docs at
https://docs.expo.dev/versions/v56.0.0/ before writing any code." Note: `package.json`
pins **Expo 55**, not 56 — confirm with the team which version is current before
upgrading anything.

## Repository

- Local: `C:\Users\anaom\IdeaProjects\readme-app-team`
- Remote: https://github.com/barrosgoncalo/readme-app (private)
- Default branch: `main` (do not push to it)
- Current working branch: `feat/setup-anaom` (will rename once the assigned slice is known)

## Repo layout

```
readme-app/
├── apps/
│   ├── mobile/                  ← Expo / React Native app (primary)
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── package.json         ← truth for mobile deps
│   │   ├── android/  ios/       ← native projects (committed)
│   │   ├── assets/              ← worm illustrations, splash, tab icons
│   │   └── src/
│   │       ├── components/      ← BookCard, MapPin, themed-text, app-tabs, login/
│   │       ├── navigation/      ← AppNavigator.js (the routing brain)
│   │       ├── screens/
│   │       │   ├── Auth/        ← Login + Register (3-step) + ForgotPassword
│   │       │   ├── Chat/        ← EventChatScreen (stub)
│   │       │   ├── Events/      ← EventDetails, MapScreen (stubs)
│   │       │   ├── Library/     ← BookList, ScannerScreen (stubs)
│   │       │   ├── Splash/
│   │       │   └── Welcome/
│   │       └── styles/
│   └── web/                     ← Vite scaffold, basically untouched
├── packages/
│   └── shared/                  ← cross-app code (re-used by mobile, eventually web)
│       └── src/
│           ├── constants/       ← theme.ts, routes.ts, authConstants.ts
│           ├── contexts/AuthContext/  ← onAuthStateChanged provider
│           ├── hooks/           ← use-color-scheme, use-theme
│           └── services/        ← auth.js (Firebase Auth flows), firebase.js (init)
├── functions/                   ← Firebase Cloud Functions (Node) — empty boilerplate
├── firebase.json                ← Firebase project config
├── firestore.rules              ← Firestore security rules
├── firestore.indexes.json
├── .firebaserc
├── AGENTS.md                    ← short note: "use Expo v56 docs" (BUT pkg says 55)
└── CLAUDE.md                    ← this file
```

## What's already shipped (as of 2026-06-15)

Recent commits (newest first):
- 2026-06-15 — docs: documented colors
- 2026-06-15 — Refactored imports
- 2026-06-15 — feat: monorepo bugs solved
- 2026-06-15 — Welcome Screen, dark mode palette, Forgot Password image, fonts → constants
- 2026-06-14 — Reset Password screen tested, Firestore security rules
- 2026-06-13 — Register Page Visuals, Google authentication, email verification
- 2026-06-12 — Beta Register screen

So **working** today:
- Splash → Welcome (first launch only via AsyncStorage `alreadyLaunched`)
- Email/password Sign Up (3 steps: credentials → personal → address) + email verification gating
- Google Sign-In (configured for both iOS and web client IDs in `auth.js`)
- Login + Forgot Password (Firebase password reset email)
- Theme constants (dark/light), shared colors, fonts (Inter, Playfair Display)
- Bottom-tab navigation shell (`AppTabs`)
- Firestore security rules for `/users/{userId}`

**Stubs / placeholders only:**
- `Chat/EventChatScreen`
- `Events/EventDetails`, `Events/MapScreen`
- `Library/BookList`, `Library/ScannerScreen`
- Cloud Functions (`functions/index.js` is boilerplate)
- No rules yet for `/books`, `/events`, `/trades`, etc.
- `apps/web/` is the default Vite template

## Firestore data model

### `users/{uid}`
From `packages/shared/src/services/auth.js → saveUserData`:

```
{
  uid,
  userId,                 // = email.trim().toLowerCase()
  username,
  fullName,
  phoneNumber,
  dob,
  profileVisibility,      // "PUBLIC" | "PRIVATE"
  role,                   // "user" | "admin"
  accountStatus,          // "active" | "suspended"
  institutionalAddress: {
    addressLine1, addressLine2, city, district, postalCode, country
  },
  createdAt,              // ISO string
  favoriteBooks: [],
  authProvider            // "email" | "google"
}
```

Constants live in `packages/shared/src/constants/authConstants.ts` —
import `USER_ROLES`, `ACCOUNT_STATUS`, `ACCOUNT_VISIBILITY` from there
instead of hardcoding strings.

### Roles
Just `user` and `admin`. The course brief mentions four roles
(end-user, activity-manager, back-officer, sysadmin) but the team
simplified to two. Confirm with the team before reintroducing the
finer-grained model.

### Other collections
`/books`, `/events`, `/trades` — **not created yet**, no rules yet,
no schema agreed yet. Don't ship code that writes to them until the
team agrees on shape + rules.

## Firestore security rules (current)

`firestore.rules` defines:
- `isAuthenticated()` — `request.auth != null`
- `isOwner(userId)` — auth uid matches
- `getMyProfile()` — fetches caller's own user doc (used by isAdmin/isActive)
- `isAdmin()` — caller's `role == 'admin'`
- `isActive()` — caller's `accountStatus == 'active'`

**`/users/{userId}` policy:**
- **read**: owner OR any authenticated active user (community read)
- **create**: must be the owner, role hard-coded to `user`, accountStatus to `active` (zero trust)
- **update**: owner-if-active and **can't touch** `role` / `accountStatus`; OR admin (no restriction)
- **delete**: admins only

Performance note: `isAdmin()` and `isActive()` each do a `get()` on the
caller's doc, billed as a read. If admin actions get frequent we should
move admin checks into a Cloud Function and stamp a custom claim on the
auth token.

## Auth flow (real)

1. **Register (email)** — `doCreateUserWithEmailAndPassword(email, password, profileData)`:
   creates Firebase Auth user → writes `users/{uid}` profile → sends verification email.
2. **Email verification** — `AuthContext.initializeUser` only counts a user as
   `userLoggedIn = true` if `emailVerified` is true (Google sign-in skips this gate).
3. **Login (email)** — `doSignInWithEmailAndPassword`: signs in, reads
   `users/{uid}`, refuses login if `accountStatus == suspended`.
4. **Google Sign-In** — uses `@react-native-google-signin/google-signin` to get
   an ID token, exchanges for a Firebase credential, creates the `users/{uid}`
   doc on first sign-in.
5. **Password reset** — `doPasswordReset(email)` → Firebase email.
6. **Sign out** — `auth.signOut()`.

Auth state lives in `packages/shared/src/contexts/AuthContext/index.jsx`:
```js
const { currentUser, userLoggedIn, loading } = useAuth();
```

## Navigation

`apps/mobile/src/navigation/AppNavigator.js` decides:
- `loading` → spinner
- `userLoggedIn` → `AppTabs` (bottom tabs)
- not logged in, first launch → Splash → Welcome → Login
- not logged in, returning → Splash → Login (with Register / Forgot Password reachable)

Route names live in `packages/shared/src/constants/routes.ts` (`ROUTES.MAIN`,
`ROUTES.LOGIN`, `ROUTES.REGISTER`, `ROUTES.FORGOT_PASSWORD`, `ROUTES.SPLASH`,
`ROUTES.WELCOME`). **Don't hardcode route strings** — use this constant.

## Commands

### Mobile
```
cd apps/mobile
npx expo start           # dev server, scan QR with Expo Go
npm run android          # build + run on connected Android
npm run ios              # build + run on iOS simulator (macOS only)
npm run web              # Expo for web (limited)
npm run lint             # expo lint
```

### Web (basic Vite)
```
cd apps/web
npm run dev
npm run build
```

### Functions
```
cd functions
npm run serve            # local emulator
# Deploy only with team approval:
# firebase deploy --only functions
```

### Firebase project access
Ask Gonçalo for read access to the Firebase project (`firebaseapp.com` console)
so we can see live Firestore data and Auth users.

## Environment / tooling notes (Windows)

- Node + npm not always on the shell PATH. If `npm` fails:
  `$env:PATH = "C:\Program Files\nodejs;" + $env:PATH`
- Expo 55 + RN 0.83 needs a recent Android Studio (Hermes default) — confirm
  with the team which Android Studio / JDK they're on.
- iOS builds require macOS — we won't be doing those from Windows.

## Security & secrets

- `apps/mobile/.env` and `apps/mobile/GoogleService-Info.plist` are committed
  in this repo by the team. Treat them as project-shared, but DON'T copy them
  to other repos or share publicly.
- Google OAuth web/iOS client IDs are hard-coded in
  `packages/shared/src/services/auth.js`. Keep them in sync if Firebase rotates them.
- Never commit a Firebase Admin service-account JSON.

## What's relevant from the obsolete previous repo (ManuelOliveiraAnao/readme-app)

Mostly nothing code-wise. The only durable things from that exploration are:
- The understanding of the course brief (requirements 2.1–2.7)
- Some text/markdown architecture notes — not the code

Everything else (Java backend, React PWA, custom auth, PBKDF2, multi-role
matrix) was thrown out by the team. Don't reintroduce any of it without
explicit discussion.

## Slice we own (TBD)

The team has assigned a specific slice — to be filled in here once the
user tells me which one. Until then, this session is in "set up the
environment and learn the codebase" mode.

Likely-unfinished areas (for context, not as a commitment):
- Events screens (`EventDetails`, `MapScreen`)
- Library + barcode `ScannerScreen`
- `EventChatScreen`
- Profile view/edit screen
- Cloud Functions for admin / moderation ops
- Firestore rules for `/books`, `/events`, `/trades`

## Model usage hint

- Architectural choices, security rules, auth flows: Sonnet / Opus
- Mechanical screen scaffolding from a clear spec: Haiku
- Debugging native build / Expo issues: Sonnet
