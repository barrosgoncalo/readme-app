# Web roadmap

Source of truth for what `apps/web` does today and what's coming.

## In place after this slice

- Routing — `react-router-dom` v6 with `<BrowserRouter>` in `main.jsx`
- Auth context wired up via `AuthProvider` from `@readme/shared`
- Pages: Splash, Welcome, Login, ForgotPassword, Register (3 steps), Home (placeholder)
- Firebase wiring — `packages/shared/src/services/firebase.web.js` reads
  `VITE_FIREBASE_*` env vars and uses `browserLocalPersistence`
- Web Google sign-in via `signInWithPopup(auth, new GoogleAuthProvider())`
- Theme — CSS variables generated from `Colors.light` / `Colors.dark`
  in `packages/shared/src/constants/theme.ts`. Light/dark via `prefers-color-scheme`.
- Fonts — Inter + Playfair Display loaded from Google Fonts CDN in `index.html`
- `.env.example` documenting the required env vars

## Known limitations / known gaps

- Email verification UX is minimal — we show "check your email" but don't
  poll for verification; user has to refresh after clicking the link
- Splash screen on web is just a brief loading state; mobile gets the
  branded Expo splash automatically, web has nothing visually equivalent
- No deep-linking yet (password reset link from email opens Firebase's
  default page, not ours)
- No PWA install / service worker / offline yet
- No bottom-tab equivalent for the authenticated area yet — Home is just
  a placeholder

## What's next (not built yet)

- Member-area shell (header, side nav, sign-out button)
- Profile screen (view + edit own `users/{uid}` doc)
- Events feed + creation
- Book catalog
- Per-event chat (Firestore subcollection with snapshot listeners)
- PWA wrapper for install-to-home-screen
- Production deploy (Firebase Hosting `firebase deploy --only hosting`)

## How to test the web auth flow today

1. Drop real values into `apps/web/.env.local` (copy from `.env.example`)
2. `cd apps/web && npm run dev`
3. Visit http://localhost:5173/
4. First visit → Splash → Welcome → Login
5. Click "Sign Up" → 3-step register → email verification email arrives
6. Click the link, refresh the page → you land on Home
7. Sign out from Home → back to Login
8. "Forgot password?" → enter your email → reset email arrives
9. The same `users/{uid}` doc is now visible to the mobile app
