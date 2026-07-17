# Phase 1 Review — App Shell

**Date:** 2026-07-12  
**Scope:** `AppShell`, content width tiers, global toast/modal roots

## What changed

### Icon rail sidebar (`components/AppShell.jsx` + `.module.css`)
- Sidebar collapses to **64px icon rail** (icons + `title` tooltips) instead of disappearing
- Pin/unpin control persisted in `localStorage` (`sidebarPinned`, `sidebarCollapsed`)
- Explore and Chat default to collapsed rail; user can pin open
- Collapse toggle (`«` / `»`) when unpinned
- Active route indicator (left accent bar on expanded nav)
- Hover/transition polish on nav links and footer actions
- **Below 720px:** unchanged horizontal top-bar behavior (labels hidden, row layout)

### Content width manager
- Inner `.contentInner` wrapper with per-route tier from `utils/contentWidth.js`:
  - `wide` → Books list, Events, Explore, public profiles
  - `reading` → book/publication/event detail routes
  - `narrow` → profile, forms, settings
  - `full` → Chat
- Browsing pages no longer rely solely on `--max-content-width: 800px` cap

### Global providers
- `ToastProvider` mounted at AppShell level
- Empty `<div id="modal-root" />` for Modal/SlideOver portals

## Files altered
- `components/AppShell.jsx`
- `components/AppShell.module.css`
- `utils/contentWidth.js` (new)
- `contexts/ToastContext.jsx` (import path fix for CSS)

## Verification
- `npx vite build` passes
