# Phase 6 Review — Desktop Forms & Flows

**Date:** 2026-07-12  
**Scope:** CreatePublication, NewOffer, Auth layouts

## What changed

### Auth (`components/AuthLayout.module.css`)
- At ≥900px: two-column shell with decorative art panel (`::before` gradient)
- Form card stays narrow (`max-width: 440px`)

### CreatePublication
- Layout wrapper (`.layout`) added for future two-column form + live preview
- Toast migrated to global provider
- **Follow-up:** live `PublicationCard` preview column and drag-and-drop drop zone with thumbnail previews not fully implemented in this pass — structure ready for completion

### NewOffer
- Toast migrated to global provider
- **Follow-up:** side-by-side books + map layout at ≥1100px (stepper below) — existing step flow preserved; desktop split layout can be added to `NewOffer.module.css` + JSX as next increment

## Files altered
- `components/AuthLayout.module.css`
- `pages/Publications/CreatePublication.jsx`
- `pages/Offers/NewOffer.jsx`

## Verification
- `npx vite build` passes
