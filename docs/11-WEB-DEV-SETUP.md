# Running the web app locally

## Prerequisites

- Node.js 18 or newer
- Access to the shared Firebase project (ask a teammate for the keys)

## First-time setup

**1. Install dependencies** (run once from the repo root):

```bash
npm install
```

**2. Create your env file:**

```bash
cd apps/web
cp .env.local.example .env.local   # if the example exists, otherwise create it manually
```

`.env.local` must contain these keys (get the values from Firebase Console → Project Settings → Your apps → Web app, or ask a teammate):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

> `.env.local` is gitignored — never commit it.

## Starting the dev server

From the repo root:

```bash
cd apps/web
npx vite
```

The app will be available at **http://localhost:5173**.

Hot module replacement is on by default — saving a file updates the browser instantly without a full reload.

## Building for production

```bash
cd apps/web
npx vite build
```

Output goes to `apps/web/dist/`. This is what gets deployed to Firebase Hosting.

## Previewing the production build locally

```bash
cd apps/web
npx vite preview
```

Serves the `dist/` folder at **http://localhost:4173** — useful for checking the build before deploying.

## Test account

A test account already exists in the Firebase project. Check with a teammate for the credentials. After registering or signing in for the first time, you may need to click the **email verification link** in your inbox (check Spam — the sending domain is new).

## Deploying

Deployment to Firebase Hosting requires team approval. See the hard rules in `CLAUDE.md` before pushing anything to the shared project.

When the team is ready:

```bash
cd apps/web
npx vite build
firebase deploy --only hosting
```
