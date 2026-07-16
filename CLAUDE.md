@AGENTS.md

# ReadMe — book-community app

A book-collection / book-trading social app with two clients that share one
backend and one business-logic layer.

## Monorepo layout

npm workspaces (`apps/*`, `packages/*`):

| Workspace | Stack | Purpose |
|-----------|-------|---------|
| `apps/web` | Vite 8 + React 19 + react-router-dom 7 | Web client |
| `apps/mobile` | Expo (~55) + React Native 0.83 + React Navigation 6 | iOS/Android client |
| `packages/shared` (`@readme/shared`) | Plain JS | Cross-platform services, contexts, models, utils, constants |

Both apps depend on `@readme/shared`. **Business logic lives in `packages/shared` and is consumed by both clients** — prefer adding/fixing logic there over duplicating it per app.

## Backend

Firebase — **Auth**, **Firestore**, **Storage**, **Hosting**. There is a single
shared Firebase project used by the whole team.

- Firestore data model: `docs/03-FIRESTORE-MODEL.md`
- Security rules: `docs/04-SECURITY-RULES.md`
- Deploying to the shared project requires **team approval** — never `firebase deploy` on your own.

## Platform-split file resolution (important)

Shared services that differ per platform ship two files, e.g.
`firebase.js` (mobile) and `firebase.web.js` (web). A single shared module
imports the extensionless path (`./firebase`) and each bundler picks the right one:

- **Web:** `apps/web/vite.config.js` sets `resolve.extensions` so `.web.js`/`.web.jsx`
  siblings win when an import has no extension (mirrors react-native-web).
- **Mobile:** Metro resolves `.js` normally.

`vite.config.js` also:
- Aliases `react`/`react-dom` to the root copy (avoids the "multiple React instances" hook error).
- Shims RN-only native modules that shared code statically imports but web never runs:
  `react-native-image-colors` and `@react-native-google-signin/google-signin`
  (see `apps/web/src/shims/`). Web does Google sign-in via Firebase `signInWithPopup` instead.

Auth context is also platform-split: `packages/shared/src/contexts/AuthContext/`
has `index.jsx` (mobile) and `web.jsx` (web). Web imports from
`@readme/shared/src/contexts/AuthContext/web`.

> When a shared service genuinely diverges web/mobile, add a `.web.js` sibling
> rather than branching on platform inside one file. See memory
> `web-mobile-service-divergence` for known intentional drift — don't re-flag it.

## Web app conventions

- **Styling:** CSS Modules (`*.module.css`) per component. Design tokens live in
  `apps/web/src/styles/themeVars.css` (colors, spacing, radius, shadows, motion,
  and width tiers). Light/dark theming via `ThemeContext` + `[data-theme]`.
- **Icons:** `lucide-react`. **Maps:** `leaflet` / `react-leaflet`.
- **Routing:** all paths centralized in `apps/web/src/constants/webRoutes.js`
  (`WEB_ROUTES`). Router in `apps/web/src/routes/AppRouter.jsx`; authed routes
  render inside `AppShell` behind `RequireAuth`.
- **Shelf vs. My Books — do not conflate these.** Shelf (`/books`,
  `WEB_ROUTES.BOOKS`, `users/{uid}/myBooks`, `MyBooksService`) is a personal
  reading list — status/progress/rating on books the user is reading. My
  Books (`/profile/my-books`, `WEB_ROUTES.PROFILE_MY_BOOKS`, the top-level
  `publications` collection filtered by `uid`) is the set of books a user has
  published as available for trade — these are what show up in Explore and
  what get offered during a swap. Don't use `myBooksService`/`MyBooksService`/
  `WEB_ROUTES.BOOKS` when the intent is the user's published listings — use
  `PublicationService.fetchUserPublications(uid)` instead (see
  `NewOffer.jsx`'s offer-creation flow for the canonical example).
- **Layout system:** `AppShell` applies a per-route content **width tier**
  (`wide` 1280 / `reading` 860 / `narrow` 720 / `full`) via
  `apps/web/src/utils/contentWidth.js`. Sidebar collapses to a 64px icon rail
  (state persisted in `localStorage`).
- **Shared UI primitives** (`apps/web/src/components/`): `Modal`, `ConfirmDialog`
  (use instead of `window.confirm`), `SlideOverPanel`, `Card`, `Skeleton`,
  `EmptyState`, `Button`, `Field`, `Toggle`. Toasts via `ToastContext` /
  `useToast` — do **not** hand-roll inline toast divs.

## Commands

Web (from `apps/web/`):

```bash
npx vite            # dev server (http://localhost:5173)
npx vite build      # production build → dist/
npx vite preview    # serve the built dist/ (http://localhost:4173)
npm run lint        # eslint
```

Mobile (from `apps/mobile/`):

```bash
npm start           # expo start
npm run android     # expo run:android
npm run ios         # expo run:ios
```

Install once from repo root: `npm install`.

## Environment

`apps/web/.env.local` (gitignored) holds the `VITE_FIREBASE_*` keys plus
`VITE_GOOGLE_BOOKS_API_KEY`. See `docs/11-WEB-DEV-SETUP.md` for the full list and
first-time setup. Mobile Firebase config lives in `packages/shared/src/services/firebase.js`
/ native config files.

## Docs

- `docs/11-WEB-DEV-SETUP.md` — running the web app locally
- `docs/03-FIRESTORE-MODEL.md`, `docs/04-SECURITY-RULES.md` — backend
- `docs/12-TRADE-MODULE-PLAN.md`, `docs/13-EVENTS-MODULE-PLAN.md`,
  `docs/14-TRADE-MODULE-GEOLOCATION.md` — feature module plans
- `docs/PLAN_UI_OVERHAUL.md` — web UI overhaul plan (web-only; no mobile changes)
- `docs/PLAN_WEB_MOBILE_MERGE.md` — the investigation that motivated
  reconciling web against main's shared-layer rewrite
- `docs/RECONCILIATION_CHANGELOG.md` — what's been done to reconcile web
  against main (shared services, Shelf/My Books split, bug fixes)
- `docs/RECONCILIATION_TODO.md` — what's still open from that reconciliation
  (known bugs, untested flows, deferred work)
