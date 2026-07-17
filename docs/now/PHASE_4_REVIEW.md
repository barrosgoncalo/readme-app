# Phase 4 Review — Profile Dashboards

**Date:** 2026-07-12  
**Scope:** Profile and PublicProfile desktop layouts

## What changed

### Profile (`pages/Profile/ProfileLayout.jsx`)
- Two-column dashboard at ≥1000px:
  - **Left:** identity card (avatar, name, stats, quick actions)
  - **Right:** settings groups as `Card` components OR sub-panel content
- Following / Followers / Favorites / Blocked Users render **in the right column** via nested routes:
  - `/profile/following`, `/profile/followers`, etc. keep deep-link URLs
- `Profile.module.css`: dashboard grid, stats row, settings groups, sub-panel shell

### PublicProfile (`pages/Users/PublicProfile.jsx`)
- Hero band: avatar, name, stats, Follow/Block actions
- Two-column body at ≥1000px:
  - **Left:** books grid (cover cards)
  - **Right:** reviews rail
- `ConfirmDialog` replaces `window.confirm` for block action
- `SkeletonGrid` loading state

## Routing
- Profile sub-routes nested under `ProfileLayout` in `AppRouter.jsx`
- Edit Profile / Change Password / Privacy remain standalone full pages

## Files altered
- `pages/Profile/ProfileLayout.jsx` (new)
- `pages/Profile/Profile.module.css`
- `pages/Profile/index.jsx` (superseded by ProfileLayout; may be removed in cleanup)
- `pages/Users/PublicProfile.jsx`, `PublicProfile.module.css`

## Verification
- `npx vite build` passes
