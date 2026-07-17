# Phase 0 Review — Design Foundation

**Date:** 2026-07-12  
**Scope:** `apps/web/src` tokens + shared primitives (no page layout changes)

## What changed

### Tokens (`apps/web/src/styles/themeVars.css`)
- Added layout tiers: `--width-narrow` (720px), `--width-reading` (860px), `--width-wide` (1280px)
- Added elevation/motion tokens: `--shadow-sm/md/lg`, `--transition-fast/base`
- Dark-theme shadow variants (higher alpha)
- `--max-content-width` now aliases `--width-narrow` for backward compatibility
- Header comment notes web-only additions (no `theme.ts` edits)

### New components
| Component | Path | Purpose |
|-----------|------|---------|
| `Modal` | `components/Modal.jsx` | Overlay, focus trap, Esc/overlay close, portal to `#modal-root` |
| `ConfirmDialog` | `components/ConfirmDialog.jsx` | Thin Modal wrapper with danger/confirm actions |
| `ToastProvider` | `contexts/ToastContext.jsx` | Global toast stack; `useToast()` re-exported from `hooks/useToast.js` |
| `Skeleton` | `components/Skeleton.jsx` | `card`, `row`, `text` variants + `SkeletonGrid` / `SkeletonList` helpers |
| `EmptyState` | `components/EmptyState.jsx` | Icon + message + optional CTA |
| `Card` | `components/Card.jsx` | Surface wrapper with optional interactive hover lift |

### Other
- `Button.module.css`: added `danger` variant
- `OfferMessage.jsx`: inline modal replaced with shared `Modal`

## Verification
- `npx vite build` passes

## Intentionally deferred
- Per-page toast CSS removal (migrated in Phase 5)
- `ToastProvider` mount (wired in Phase 1 AppShell)
