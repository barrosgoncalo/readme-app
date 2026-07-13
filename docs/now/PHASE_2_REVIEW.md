# Phase 2 Review — Browsing Card Grids

**Date:** 2026-07-12  
**Scope:** Books, Explore, Favorites, Events list pages

## What changed

### Books (`pages/Books/`)
- Responsive cover grid: `repeat(auto-fill, minmax(160px, 1fr))`
- New `BookCard` `grid` variant (cover-forward: title, author, status chip, progress bar)
- Grid/list view toggle (hidden on mobile)
- `SkeletonGrid` while loading; `EmptyState` with "Add your first book" CTA
- Removed page-level `max-width` (uses AppShell `--width-wide`)

### Explore (`pages/Map/`)
- Publications: vertical card grid (`pubGrid`) with cover-top layout
- Users tab: card grid (`userGrid`) instead of single-column list
- Sticky header zone (title, search, tabs)
- `SkeletonGrid` + `EmptyState` for publications
- `/` keyboard shortcut focuses search input

### PublicationCard (`pages/Map/components/`)
- Restyled for grid: cover on top, seller row, status/like footer, heart overlay

### Favorites (`pages/Profile/Favorites.jsx`)
- Inherits updated `PublicationCard` grid styling via shared CSS class

### Events (`pages/Events/`)
- Card grid with **date-block** visual (day number + month/year)
- Type chip + attendee count in footer
- "Create event" opens `Modal` instead of inline form swap
- `SkeletonGrid` loading; `EmptyState` for empty list

## Files altered
- `pages/Books/index.jsx`, `Books.module.css`, `components/BookCard.jsx`, `BookCard.module.css`
- `pages/Map/index.jsx`, `Map.module.css`, `components/PublicationCard.module.css`
- `pages/Events/index.jsx`, `Events.module.css`, `components/EventCard.jsx`, `EventCard.module.css`

## Verification
- `npx vite build` passes
