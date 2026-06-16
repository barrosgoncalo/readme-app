# `apps/web` — README web client

The web companion to `apps/mobile`. Same Firebase project, same `users/{uid}`
schema, same auth contract.

## Run locally

```bash
# from repo root, once: install all workspaces
npm install

# start the dev server
cd apps/web
npm run dev
# → http://localhost:5173
```

## Env vars

Copy `.env.example` to `.env.local` and fill in real Firebase web config
values (ask Gonçalo). `.env.local` is gitignored.

## Stack

- React 19 + Vite 8
- `react-router-dom` v6
- Firebase JS SDK (web) — `browserLocalPersistence`
- Shared auth context from `@readme/shared`

## Structure

```
src/
├── routes/AppRouter.jsx     who-sees-what (mirrors mobile's AppNavigator)
├── auth/RequireAuth.jsx     guard for protected routes
├── pages/
│   ├── Splash.jsx
│   ├── Welcome.jsx          first launch only (localStorage flag)
│   ├── Login.jsx
│   ├── ForgotPassword.jsx
│   ├── Register/            3-step flow (mirrors mobile)
│   └── Home.jsx             post-login placeholder
├── styles/
│   ├── themeVars.css        CSS vars from packages/shared theme.ts
│   └── global.css           font wiring + base styles
├── App.jsx
└── main.jsx
```

See [../../docs/](../../docs/) for project-wide architecture, auth flow,
security rules, and conventions.
