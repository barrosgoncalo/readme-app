# 15 — Admin Panel

The web app (`apps/web`) is repurposed as an **admin-only control panel** (regular
users are on mobile). This doc covers its current structure, the consolidation of
parallel work onto `refactor/web`, and how to keep developing it.

## Branch

All admin work lives on **`refactor/web`** (not yet merged to `main`). Multiple
people push here concurrently — **always `git fetch origin refactor/web` before you
push**, and keep commits small and single-purpose to avoid the messy half-merges
that happened early on.

## Structure

```
apps/web/src/
  components/
    AdminShell.jsx            # Outlet layout: sidebar + topbar (the ONLY shell — do not duplicate under pages/)
    AdminSideBar.jsx          # nav (Dashboard/Users/Reports/Settings/Logs) + Quick Actions
    AdminTopBar.jsx           # bell + admin profile
    Pagination.jsx, StatusBadge.jsx, Dropdown.jsx
  pages/Admin/
    AdminDashboard.jsx        # Users page: user table, search, pagination, Promote/Demote
    Reports/
      ReportsPage.jsx         # the real Reports page (stat cards + filters + table + info cards)
      ReportsStatCards.jsx, ReportsFilterBar.jsx, ReportsTable.jsx, ReportRow.jsx, InfoCards.jsx
  routes/AppRouter.jsx        # /login, /admin→/admin/users, /admin/users, /admin/reports
  constants/adminRoutes.js
packages/shared/src/
  hooks/use-admin-reports.ts  # real-time reports data hook
  services/admin.js           # alterUserPrivileges() — role change, region-correct
  services/reports.js         # ReportsService (subscribe/update)
```

Only **Users** and **Reports** are live nav routes; Dashboard/Settings/Logs are
labeled but inert (pages not built yet).

### Icons & Vite

Lucide icons are **auto-imported** as `IconLucide*` JSX (no import line) via
`unplugin-auto-import` + `unplugin-icons` in `vite.config.js`. This requires
`@svgr/core` and `@svgr/plugin-jsx` as dev deps.

## Role management

- `users/{uid}.role` — Firestore field, for UI queries.
- Firebase Auth custom claim `role: "admin"` — for the server-side function guard.
- Both are synced by the **`setAdminStatus`** callable Cloud Function
  (`functions/index.js`), which requires the caller to already have
  `role: "admin"` in their token claims.

> **Region gotcha:** `setAdminStatus` is deployed in **`europe-west1`**. The client
> MUST call `getFunctions(app, 'europe-west1')` — the default (`us-central1`) returns
> `404`/`internal`. Use the shared `alterUserPrivileges()` in
> `packages/shared/src/services/admin.js`, which is already region-correct.

Deploy the function with (needs team approval — do not deploy solo):

```bash
firebase deploy --only functions:setAdminStatus
```

## Consolidation (2026-07-15)

Two people built the admin panel in parallel, producing overlapping work on
`refactor/web`. It was reconciled by taking the teammate's "full refactor base"
(`317470a`) and applying only the fixes still missing:

| Fix | File | Why |
|-----|------|-----|
| Role-change region | `pages/Admin/AdminDashboard.jsx` | Was `getFunctions()` (us-central1) → `internal`/404 on Promote/Demote. Now calls `admin.js` `alterUserPrivileges()` (europe-west1). |
| Quick Actions placement | `components/AdminSideBar.module.css` | `margin-top: auto` pinned it to the sidebar floor with a big gap → `24px`, sits under the nav. |
| Duplicate shell | removed `pages/Admin/AdminShell.jsx`/`.module.css` | Two copies existed; router only imports `components/AdminShell.jsx`. |

The teammate's approach to wiring the Reports page (renaming `index.jsx` →
`ReportsPage.jsx` so the existing router import resolves) was kept as-is.

### Reports stat-card overflow fix

The stat-card grid used `grid-template-columns: repeat(4, 1fr)`. `1fr` has a
min-content floor, so the four cards refused to shrink and their numbers/labels
overflowed the container on narrower widths. Fixed in
`ReportsStatCards.module.css`:

- `repeat(4, minmax(0, 1fr))` — lets cards shrink so text wraps *inside* each card.
- `@media (max-width: 1100px)` → 2×2 layout.
- `min-width: 0` on `.card` and its text block.

## Next steps

- **Deploy `setAdminStatus`** (blocks Promote/Demote until done).
- Wire the Reports **Export** button and per-report actions (the
  `use-admin-reports` hook exposes `setReportStatus`).
- Build the parked tabs: Dashboard, Settings, Logs.
- Possible future: split the admin panel into its own repo.
