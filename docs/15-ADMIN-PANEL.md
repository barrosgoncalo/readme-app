# 15 — Admin Panel

The web app (`apps/web`) is repurposed as an **admin-only control panel** (regular
users are on mobile). This doc covers its current structure, how role management
and Quick Actions work, and the history of how it got here.

## Branch

`refactor/web` has been merged into **`main`** — admin work now happens directly
on `main` (or short-lived feature branches merged back into it). Multiple people
still touch these files concurrently — **always `git fetch origin main` before you
push**, and keep commits small and single-purpose.

## Structure

```
apps/web/src/
  components/
    AdminShell.jsx              # Outlet layout: sidebar + topbar (the ONLY shell — do not duplicate under pages/)
    AdminSideBar.jsx             # nav (Dashboard/Users/Publications/Reports/Settings/Logs) + Quick Actions
    AdminTopBar.jsx               # bell + admin profile
    UserDetailModal.jsx          # full-profile read-only modal, used by Users page + Search Users quick action
    Pagination.jsx, StatusBadge.jsx, Dropdown.jsx
    quick-actions/
      QuickActionModal.jsx       # shared overlay/close/Escape base used by all 4 quick actions
      SearchUsersModal.jsx, BanUserModal.jsx, BannedUsersModal.jsx, ReportReasonsModal.jsx
  contexts/
    QuickActionsContext.jsx      # openAction/closeAction, mounted once in AdminShell
  pages/
    Users/
      UsersPage.jsx              # user table: search, pagination, Promote/Demote, CSV export, view-detail eye button
    Publications/
      Publications.jsx           # book listings table (title/author/genre/owner/status), search, delete, detail modal
    Reports/
      ReportsPage.jsx            # stat cards + filters + table + info cards
      ReportsStatCards.jsx, ReportsFilterBar.jsx, ReportsTable.jsx, ReportRow.jsx, InfoCards.jsx
      ReportDetailModal.jsx      # eye-button modal: reason/status/reporter/reported user + type-specific context snapshot
    Dashboard/
      Dashboard.jsx              # stat cards + recharts (Reports by reason pie, Accounts by rank bar)
    Admin/Settings/
      SettingsPage.jsx           # admin profile (editable display name), sign-out, read-only platform info
  routes/AppRouter.jsx           # /login, /admin→/admin/users, /admin/{users,publications,reports,dashboard,settings}
  constants/adminRoutes.js
packages/shared/src/
  hooks/
    use-admin-reports.ts         # real-time reports data hook (filters, pagination, userMap resolution)
    use-explore-feed.ts          # powers Publications' paginated book list
  services/
    admin.js                     # alterUserPrivileges() — role change, region-correct
    reports.js                   # ReportsService (subscribe/update)
```

Only **Logs** is still labeled but inert (nav item disabled, no page built).
Dashboard, Users, Publications, Reports, and Settings are all live.

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

## Quick Actions

Four sidebar shortcuts, backed by `QuickActionsContext` (mounted in `AdminShell`,
so any page can open one without prop-drilling):

| Action | What it does |
|---|---|
| **Search Users** | Loads all users, filters client-side by name/username/email, opens `UserDetailModal` on click. |
| **Ban User** | Search → select → confirm card → sets `users/{uid}.accountStatus = 'banned'`. Already-banned users show greyed out in results. |
| **View Banned Users** | Queries `accountStatus == 'banned'`, each row has an Unban button (`accountStatus = 'active'`). |
| **Report Reasons** | Static reference list of `REPORT_REASON_LABELS` with plain-English descriptions. |

All four share `QuickActionModal` (overlay, Escape-to-close, backdrop-click-to-close).

**Note:** ban/unban currently only sets a Firestore field — there is no enforcement
yet (a banned user can still log in and use the app). See Next steps.

## Reports detail modal

The eye button on each report row opens `ReportDetailModal`, which renders:
reason, status, target type, report count, reporter/reported-user cards, and a
**type-specific context snapshot**:

- `chat` → message history (`buildChatSnapshot`)
- `publication` → book preview (`buildPublicationSnapshot`)
- `account` → reported account card (`buildAccountSnapshot`)

Quick status actions (reviewed/actioned/dismissed) are available directly from
the modal footer, calling the same `setReportStatus` used by the row's `⋮` menu.

## History

### Consolidation (2026-07-15)

Two people built the admin panel in parallel on `refactor/web`, producing
overlapping work. It was reconciled by taking the teammate's "full refactor
base" and applying only the fixes still missing (role-change region, Quick
Actions placement, a duplicate `AdminShell`). `refactor/web` was later merged
into `main`; a teammate's own `Dashboard`/`Publications` work landed on `main`
around the same time via separate feature branches — no conflicts, since the
route table just gained rows.

### Reports stat-card & Actions-column overflow (2026-07-15)

`grid-template-columns: repeat(4, 1fr)` doesn't let cards shrink below their
content's natural width, so stat cards and the Actions column overflowed their
containers on narrower widths. Fixed with `minmax(0, 1fr)` + `min-width: 0` on
inner text blocks, and by wrapping wide tables in `overflow-x: auto` containers
instead of letting the page body scroll.

### Bug & responsiveness pass (2026-07-16)

- **Duplicate React fixed.** `apps/web/package.json` had declared `react`/`react-dom`
  `^19.2.7` while the monorepo root (pinned by Expo, which needs exactly `19.2.0`)
  had `19.2.0`. npm nested a second React copy under `apps/web/node_modules`,
  causing recurring **"Invalid hook call"** console errors. Now pinned to `19.2.0`
  everywhere; nested copy removed.
- **Users and Publications tables** now wrap in the same `overflow-x: auto`
  pattern Reports already used, so the page body no longer scrolls horizontally
  on narrow screens.
- **Sidebar collapses to a 64px icon rail below 900px** (labels hidden, icons
  centered); content padding drops from 32px to 16px at the same breakpoint.
- **Renamed `AdminSideBar.module.css` → `AdminSidebar.module.css` and
  `AdminTopBar.module.css` → `AdminTopbar.module.css`** to match their import
  statements. The mismatch worked on Windows (case-insensitive filesystem) but
  would have failed the build on Linux CI/deploy.

## Next steps

- **Deploy `setAdminStatus`** if not already done — Promote/Demote fails with
  `functions/internal` until it is (region-correct client code is already in place).
- **Ban enforcement** — `accountStatus: 'banned'` is currently cosmetic; nothing
  blocks a banned user's auth/API access. Needs a Firestore rule or Cloud
  Function check.
- **Wire "Export Reports"** on the Reports page header (Users already has a
  working CSV export in `UsersPage.jsx` — same pattern, different columns).
- **Build the Logs page** — no audit trail exists yet for admin actions
  (promote/demote/ban/report-status changes). Worth a shared `adminLogs`
  collection write on each action, then a simple table page.
- **Code-split the Dashboard** — production build flags a 1.4 MB JS chunk,
  mostly `recharts`; lazy-load the Dashboard route.
- Consider extracting the 3+ places that each fetch the full `users` collection
  (UsersPage, SearchUsersModal, BanUserModal) into one shared hook.
