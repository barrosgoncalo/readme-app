# Web UI Overhaul Plan

Branch: `phase2/web-mobile-unification-anaom` (or a new `phase3/ui-overhaul` branch off it).
Goal: make the web app feel like a **desktop application**, not a centered mobile
column — cleaner visual language, richer interactivity, and layouts that use
the horizontal space a big screen provides.

**Scope guard:** this is a layout/interaction overhaul, NOT a rebrand. Keep the
warm bookish identity (Playfair Display headings, brown/orange palette, current
light/dark tokens). No new UI framework — CSS modules + tokens stay. Do not
touch `apps/mobile/` or shared services; this plan is `apps/web/src` only
(plus additive token edits to `themeVars.css`).

## Current-state diagnosis (verified 2026-07-12)

1. **800px straitjacket** — `--max-content-width: 800px` caps 14 pages
   (Books, Events, Explore, Profile, Favorites, PublicProfile, publication
   pages, …). On a 1440p+ screen the app is a phone column with huge margins.
2. **Single-column lists everywhere** — Books, Events, Explore feed and
   Favorites all render `flex-direction: column` rows. No responsive grids.
3. **Mobile navigation patterns on desktop** — Profile is an iOS-style
   settings list (icon + chevron rows) that navigates to full subpages;
   detail views (BookDetail, PublicationDetails, EventDetails) are full page
   swaps even though the screen could show list + detail together (Chat
   already proves the two-pane pattern works here).
4. **Thin interactivity** — full-page `Spinner` for every load (no
   skeletons), `window.confirm()` for destructive actions, ~6 hand-rolled
   `.toast` divs duplicated across page CSS, few hover/transition states,
   no keyboard affordances.
5. **Good bones** — token system, dark mode, serif/sans pairing, and a
   reusable component set (`Button`, `Field`, `PageHeader`, `UserAvatar`,
   `BookCover`, `Toggle`, `DateTimePicker`) already exist. The overhaul
   builds on these, it does not replace them.

## Global rules (read before every phase)

1. Never push to `main`. Commit per phase with conventional messages.
2. **Both themes, always**: every new style must use tokens and be checked in
   light AND dark mode (`data-theme="dark"`).
3. **Don't break mobile web**: every page keeps working below 720px — the
   existing `@media (max-width: 720px)` behavior is the floor. Desktop
   enhancements go in the default styles or `min-width` queries.
4. No new runtime dependencies without asking (exception: none anticipated —
   modals, skeletons, grids and transitions are all doable with React + CSS).
5. Reuse before creating: extend `components/` primitives; if a third copy of
   a pattern appears, extract it.
6. **Verification ritual per phase**: `cd apps/web && npx vite build` passes;
   preview server (name `web`, port 5200) shows zero console errors;
   screenshot the changed pages at desktop width AND ~700px, in both themes.
7. Keep `themeVars.css` header comment honest — if tokens are added, note
   they are web-only additions (do NOT edit `packages/shared/constants/theme.ts`).

---

## Phase 0 — Design foundation (tokens + primitives, no page changes)

### 0.1 Token additions (`apps/web/src/styles/themeVars.css`, additive only)
```css
/* Layout tiers — replaces the one-size 800px cap */
--width-narrow: 720px;    /* forms, settings, auth */
--width-reading: 860px;   /* detail/reading pages */
--width-wide: 1280px;     /* browsing grids: Books, Explore, Events */
/* Elevation & motion */
--shadow-sm: 0 1px 3px rgba(0,0,0,.08);
--shadow-md: 0 4px 12px rgba(0,0,0,.10);
--shadow-lg: 0 12px 32px rgba(0,0,0,.18);
--transition-fast: 120ms ease;
--transition-base: 200ms ease;
```
Dark-theme variants for shadows (higher alpha). Keep `--max-content-width`
as an alias of `--width-narrow` so untouched pages don't shift yet.

### 0.2 New shared primitives (`apps/web/src/components/`)
- **`Modal.jsx`** — overlay + panel + focus trap + Esc/overlay-click close.
  Extract from the inline modal in `OfferMessage.jsx` (which then consumes it).
- **`ConfirmDialog.jsx`** — thin Modal wrapper (title, body, danger/confirm
  buttons). Will replace every `window.confirm` (PublicationDetails delete,
  PublicProfile block, BookDetail delete).
- **`ToastProvider`** (`contexts/ToastContext.jsx`) — one fixed toast stack
  rendered at AppShell level; `useToast()` keeps its `[toast, showToast]`-like
  call site or gets a codemod-simple `showToast(msg, {variant})` API. Delete
  the per-page `.toast` CSS copies as pages migrate (Phases 2–5).
- **`Skeleton.jsx`** — shimmering placeholder blocks (`card`, `row`, `text`
  variants) to replace full-page Spinners on list pages.
- **`EmptyState.jsx`** — icon + message + optional CTA button; replaces the
  bare `<p className={styles.empty}>` pattern.
- **`Card.jsx`** — surface wrapper (`--bg-elem`, radius-lg, shadow-sm,
  hover: shadow-md + translateY(-2px) when `interactive`).

Verify & commit: `feat(web): design tokens + Modal/Confirm/Toast/Skeleton/EmptyState/Card primitives`.

---

## Phase 1 — App frame (AppShell)

- **Icon-rail collapse**: sidebar collapses to a 64px icon-only rail (icons +
  tooltips) instead of disappearing into a top wordmark. Explore/Chat default
  to the rail; user can pin/unpin (persist in `localStorage`). Keep the
  current `<720px` horizontal top-bar behavior.
- **Content width manager**: `.content` gets an inner container driven by a
  per-route width tier (browsing routes → `--width-wide`, detail →
  `--width-reading`, forms/settings → `--width-narrow`).
- Move `ToastProvider` mount + portal root for `Modal` here.
- Active-route indicator, hover transitions, and a subtle top "page header
  zone" convention so pages stop hand-rolling headers.

Verify & commit: `feat(web): app shell — icon rail, width tiers, global toast/modal roots`.

---

## Phase 2 — Browsing pages become grids (the visible payoff)

- **Books (`pages/Books`)**: responsive cover grid
  `repeat(auto-fill, minmax(160px, 1fr))` — cover-forward cards (cover, title,
  author, status chip, progress bar). Keep list view as a toggle if cheap.
  Skeleton grid while loading; EmptyState with "Add your first book" CTA.
- **Explore (`pages/Map`)**: publications feed becomes a card grid (cover
  image top, seller row, like/status footer) at `--width-wide`; sticky
  search/tab bar. Users tab results get the same Card treatment.
- **Favorites**: reuse the same grid (already shares `PublicationCard`).
- **Events**: card grid with date-block visual (big day number + month),
  type chip; "Create event" opens the form in a `Modal` instead of inline
  page swap.

Verify & commit: `feat(web): responsive card grids for Books/Explore/Favorites/Events`.

---

## Phase 3 — Master–detail layouts (use the width)

- **Explore → publication detail as slide-over panel**: clicking a
  publication opens a right-side panel (~480px, shadow-lg, Esc/overlay to
  close) over the grid, driven by the existing `/publications/:pubId` route so
  deep links still work (panel when navigated from grid, full page on direct
  load — or always panel with the grid behind; decide during implementation,
  keep URLs stable either way).
- **Books → split view**: at ≥1100px, `/books/:bookId` renders the book grid
  (narrowed) on the left and detail on the right — same pattern Chat already
  uses. Below that, current full-page detail stays.
- **Events → detail panel** (same slide-over component as Explore).

Verify & commit: `feat(web): master–detail split views and slide-over detail panels`.

---

## Phase 4 — Profile & public profile as desktop dashboards

- **Profile (`pages/Profile/index.jsx`)**: two-column layout at ≥1000px —
  left: identity card (avatar, name, stats: books/following/followers/rating)
  + quick actions; right: settings groups rendered as cards. Following /
  Followers / Favorites / Blocked open **in place** (right column swaps, or
  Modal for lists) instead of full-page navigations. Keep routes working for
  deep links.
- **PublicProfile**: hero band (avatar, name, stats, Follow/Block actions)
  over a two-column body — books grid left (reuse Phase 2 card), reviews
  rail right.

Verify & commit: `feat(web): dashboard-style profile and public profile layouts`.

---

## Phase 5 — Interactivity & motion pass

- Replace remaining full-page `Spinner`s with `Skeleton`s (Chat list,
  UserListPage, PublicationDetails, NewOffer).
- Replace all `window.confirm` with `ConfirmDialog`.
- Migrate remaining hand-rolled toasts to `ToastProvider`; delete dead
  `.toast` CSS.
- Motion: card hover lift, panel slide-in (`--transition-base`), button
  press states, `prefers-reduced-motion` guard on all of it.
- Keyboard: Esc closes panels/modals (from Phase 0 Modal), `/` focuses the
  Explore/Books search input.
- **Drag-and-drop image upload** in CreatePublication (drop zone +
  thumbnail previews with remove buttons — upgrade from filename list).

Verify & commit: `feat(web): skeletons, dialogs, unified toasts, motion + keyboard affordances`.

---

## Phase 6 — Forms & flows on desktop

- **CreatePublication**: two-column at ≥1000px — form fields left, live
  publication-card preview right (reuses `PublicationCard`).
- **NewOffer**: replace the two hidden steps with a side-by-side layout at
  ≥1100px (books selection left, map right, sticky summary/submit footer);
  keep the stepper below that width.
- **Auth pages**: minor — wider `AuthLayout` art panel, form stays narrow.

Verify & commit: `feat(web): desktop layouts for create-publication and offer flows`.

---

## Final phase — audit & report

- Sweep every page in both themes at 1440px, 1024px, 700px; fix stragglers.
- Delete `--max-content-width` alias if nothing uses it; delete dead CSS
  (`pages/Map/components/TradeCard.*` is already flagged as dead).
- Report: what changed per phase, any intentionally kept mobile patterns,
  and any follow-ups (e.g. list virtualization if Books grows large).

## Suggested order & sizing

Phases 0–1 are the enablers (do first, ~small). Phase 2 is the biggest
visible win. 3 and 4 are the "desktop app" feel. 5–6 are polish and can be
reordered or trimmed. Each phase is independently committable; stop after
any phase and the app is still coherent.
