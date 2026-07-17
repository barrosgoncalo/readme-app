# Phase 3 Review — Master–Detail Layouts

**Date:** 2026-07-12  
**Scope:** Split views and slide-over detail panels

## What changed

### Shared `SlideOverPanel` (`components/SlideOverPanel.jsx`)
- Right-side panel (~480px), overlay dismiss, Esc close, slide-in animation
- `prefers-reduced-motion` guard

### Explore → publication detail
- `DetailRoutes.jsx` → `PublicationDetailRoute`
- At ≥900px: Explore grid stays visible; publication opens in slide-over
- Below 900px: full-page `PublicationDetails` (unchanged mobile behavior)
- URL `/publications/:pubId` preserved for deep links

### Books → split view
- `BooksLayout.jsx` wraps `/books` and `/books/:bookId`
- At ≥1100px: narrowed book grid left + `BookDetail` right (`embedded` mode)
- Below 1100px: full-page detail

### Events → detail panel
- `EventDetailRoute` mirrors publication pattern with Events list behind panel

### Detail component updates
- `BookDetail`, `PublicationDetails`, `EventDetails` accept `embedded` + `onClose` props
- Skeleton loading in embedded contexts

## Routing (`routes/AppRouter.jsx`)
- Books routes → `BooksLayout`
- `/publications/:pubId` → `PublicationDetailRoute`
- `/events/:eventId` → `EventDetailRoute`

## Verification
- `npx vite build` passes
