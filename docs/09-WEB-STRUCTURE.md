# Web folder structure

```
apps/web/
├── index.html              ← page shell, loads /src/main.jsx
├── package.json
├── vite.config.js
├── .env.local              ← real Firebase keys (gitignored)
├── .env.example            ← template for .env.local
└── src/
    ├── main.jsx            ← app entry: wraps <App /> in providers
    ├── App.jsx             ← thin wrapper, renders <AppRouter />
    ├── index.css           ← global resets
    │
    ├── routes/             ← the one router for the whole app
    │   └── AppRouter.jsx
    │
    ├── auth/               ← route-level auth guard
    │   └── RequireAuth.jsx
    │
    ├── components/         ← reusable UI shared across pages
    │   ├── AppShell.jsx        (logged-in layout w/ sidebar)
    │   ├── AuthLayout.jsx      (centered card for auth screens)
    │   ├── Button.jsx
    │   └── Field.jsx           (labeled form input)
    │
    ├── pages/              ← one folder/file per screen
    │   ├── Splash.jsx
    │   ├── Welcome.jsx
    │   ├── Login.jsx
    │   ├── ForgotPassword.jsx
    │   ├── Register/           (3-step sign-up flow)
    │   ├── Books/              (My Books + Scan)
    │   ├── Map/                (Explore)
    │   ├── Events/Details.jsx  (single event view)
    │   ├── Chat/               (Community)
    │   └── Profile/
    │
    ├── constants/
    │   └── webRoutes.js    ← every URL path in one place
    │
    ├── styles/
    │   ├── themeVars.css   ← colors, fonts, spacing
    │   └── global.css
    │
    └── assets/             ← images, icons
```

## What each folder is for

**`routes/`** — Decides which page renders for which URL. Logged out → auth
screens. Logged in → `AppShell` wraps every section page.

**`auth/`** — `RequireAuth` blocks logged-out users from protected routes
and remembers where they were trying to go.

**`components/`** — UI pieces used by more than one page. If a thing is only
used in one page, it stays in that page's folder.

**`pages/`** — One folder (or file) per screen. Pages are the only place
that knows about its own layout and form state.

**`constants/`** — Things that shouldn't be retyped as raw strings. Right
now it's just route paths.

**`styles/`** — CSS variables and global resets. Every page reads colors
and spacing from `themeVars.css` — never hardcode hex codes.

**`assets/`** — Static files (images, SVG icons) imported by pages.

## What lives outside `apps/web/`

Auth, Firebase, and the user data model are imported from
`@readme/shared` so mobile and web stay in sync. Web uses the `.web`
variants of those files (popup-based Google sign-in, browser persistence).
See [05-AUTH-FLOW.md](05-AUTH-FLOW.md).
