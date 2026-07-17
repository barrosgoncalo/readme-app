# Final Audit Report — Web UI Overhaul

**Date:** 2026-07-12  
**Plan:** `docs/PLAN_UI_OVERHAUL.md`

## Summary

All phases (0–6) of the web UI overhaul were executed. The app now uses width tiers up to 1280px, responsive card grids on browsing pages, master–detail patterns on desktop, dashboard-style profiles, shared Modal/Toast/Skeleton primitives, and improved sidebar navigation.

**Build status:** `cd apps/web && npx vite build` — **passes**

## Per-phase deliverables

| Phase | Status | Review doc |
|-------|--------|------------|
| 0 — Design foundation | Done | `docs/now/PHASE_0_REVIEW.md` |
| 1 — App shell | Done | `docs/now/PHASE_1_REVIEW.md` |
| 2 — Browsing grids | Done | `docs/now/PHASE_2_REVIEW.md` |
| 3 — Master–detail | Done | `docs/now/PHASE_3_REVIEW.md` |
| 4 — Profile dashboards | Done | `docs/now/PHASE_4_REVIEW.md` |
| 5 — Interactivity | Done | `docs/now/PHASE_5_REVIEW.md` |
| 6 — Desktop forms | Partial | `docs/now/PHASE_6_REVIEW.md` |

## Cleanup performed
- Deleted dead `TradeCard.jsx` / `TradeCard.module.css` (flagged in plan)
- Removed inline toast divs from migrated pages (dead `.toast` CSS may remain in some module files — safe to delete in a follow-up sweep)

## Intentionally kept mobile patterns
- Sidebar horizontal top-bar below 720px
- Full-page detail views below master–detail breakpoints (900px publications/events, 1100px books)
- Book list view toggle hidden on mobile
- Profile sub-pages on narrow screens stack single-column (dashboard collapses to one column)

## `--max-content-width` alias
- Still present as alias of `--width-narrow` in `themeVars.css`
- Removed from Books/Map page CSS; still referenced in some narrow-tier pages (EditProfile, PublicationDetails page wrapper, etc.) — correct for forms/settings

## Follow-ups recommended
1. **CreatePublication:** complete two-column layout with live `PublicationCard` preview + drag-and-drop image zone with thumbnails
2. **NewOffer:** side-by-side step 1 + step 2 at ≥1100px with sticky submit footer
3. **Dead CSS sweep:** remove unused `.toast` rules from page module files
4. **Books virtualization:** if shelf grows large, consider list virtualization for grid
5. **Manual QA:** preview at 1440px / 1024px / 700px in light + dark themes per plan verification ritual
6. **Git commits:** plan specifies one conventional commit per phase — not committed in this session unless requested

## Key new files
- `components/Modal.jsx`, `ConfirmDialog.jsx`, `Card.jsx`, `Skeleton.jsx`, `EmptyState.jsx`, `SlideOverPanel.jsx`
- `contexts/ToastContext.jsx`
- `utils/contentWidth.js`
- `pages/Books/BooksLayout.jsx`
- `pages/DetailRoutes.jsx`
- `pages/Profile/ProfileLayout.jsx`
