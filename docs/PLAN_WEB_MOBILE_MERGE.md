# Plan: reconciling `main` (mobile) into web — merge strategy & feature port

**Author:** investigation on branch `phase2/web-mobile-unification-anaom`
**Date:** 2026-07-15
**Status:** superseded by execution. Stages 0–2 (adopt main's architecture,
take the shared layer wholesale, reconcile web's pages against it) are done on
`integration/main-merge-anaom` — see `docs/RECONCILIATION_CHANGELOG.md` for
what was actually done and `docs/RECONCILIATION_TODO.md` for what's left,
including the Stage 3 feature ports (§6 below) which have not been started.

## 1. TL;DR

`git merge origin/main` into this branch produces **23 conflicted files**, and the
conflicts are not line-level noise — `main` and this branch **independently
refactored the same shared layer in incompatible ways**. A blind merge would
leave the shared services half-rewritten and the web app broken. This doc
inventories what the mobile team built, explains the collision, and lays out a
staged plan to bring their work to web safely.

## 2. What `main` contains now

Since our merge-base (`e38eb67`), `main` advanced **187 files, +13.7k / −2.8k**.
It is one large mobile-team integration. Two distinct things landed:

### 2a. A new shared architecture (the source of the conflicts)

- **`DB.js`** — a Firestore wrapper (`DB.get / getOrderedBy / create / update /
  delete / stream`). Every service now goes through it instead of calling
  `firebase/firestore` directly.
- **Per-service `.web.js` siblings** — `auth.web.js`, `books.web.js`,
  `booksCatalog.web.js`, `events.web.js`, `trades.web.js`, `user.web.js`,
  `users.web.js`. main did its **own** web/mobile split, with a different
  pattern than ours.
- **Services converted to objects** — e.g. `users.js` is now a `UsersService = {…}`
  object; ours is standalone exports (`fetchUserProfile`, `getFollowCounts`, …)
  that the web app imports by name. **Direct collision.**
- **New services**: `cloudFunctions.js`, `storage.js`, `location.js`,
  `block.js` (replaces `blockUser.js`), `recentSearches.js`, `searchBook.js` +
  `searchUser.js` (replace `search.js`).
- **Deleted**: `blockUser.js`, `search.js`, `user.js`, `env.js`, `env.web.js`.
- **31 new cross-platform hooks** in `packages/shared/src/hooks/*.ts` (TypeScript):
  `use-chat-actions`, `use-chat-room-data`, `use-explore-feed`,
  `use-notifications`, `use-paginated-list`, `use-public-profile`,
  `use-favorite-status`, `use-my-books`, `use-swap-verification`, etc. This is a
  deliberate "logic in shared hooks, thin platform UI" architecture.

### 2b. New product features (what we actually want on web)

| Feature | Where it lives on `main` | Backend |
|---------|--------------------------|---------|
| **Gamification / literary levels** | `constants/gamification.ts` (9 ranks + badge PNGs), `Profile/LiteraryLevels`, `utils/gamificationUtils.js` | `updateUserGamification` bumps `gamification.completedSwapsCount`/`rank` on swap complete |
| **Notifications feed** | `Profile/Notifications`, `use-notifications.ts`, `services` notif reads | `Notification` model → `users/{uid}/notifications`; `purgeOldNotifications` cron trims >15 days |
| **Push notifications** | `utils/pushTokenHelper.js`, FCM token storage | `onOfferMessageCreated`, `onOfferAccepted`, `onOfferDeclined`, `onSwapCancelled`, `onFollowCreated`, `onFollowRequestCreated` all `sendPushNotification` |
| **Follow requests** (private accounts) | `models/follow.js` `createFollowRequest`, `followRequests` collection | `onFollowRequestCreated`, `onFollowCreated` fan-out |
| **Infinite scroll** | `use-paginated-list.ts` + `pagination-adapters.ts`; Explore users & publications | — |
| **Explore filters** | `use-explore-feed.ts`, Explore/Search screens | — |
| **Recent searches** | `recentSearches.js`, `use-recent-searches.ts`, `searchBook.js`/`searchUser.js` | — |
| **Chat redesign + soft-delete** | `use-chat-actions.ts`, `use-chat-room-data.ts`; `sendTextMessage` now writes `hiddenFor: []` | `purgeInactiveChats` cron hard-deletes inactive chats (see §5) |
| **Swap flow** (QR verify, counter-offer, review) | `Swap/QRVerification`, `Swap/CounterOffer`, `Swap/Review`, `use-swap-*` hooks | `verifySwapCode` callable, `deleteBooksOnSwapComplete`, `onPublicationBecameUnavailable` |

## 3. Why a blind merge fails

The web app currently imports named exports from the **old** shared services this
branch unified (`fetchUserProfile`, `getFollowCounts`, `getFollowing`,
`toggleFollowUser`, `myBooksService`, …). On `main` those files are rewritten as
service objects backed by `DB.js`, or deleted outright (`blockUser.js`,
`search.js`, `user.js`). Auto-resolving the 23 conflicts would either:

- keep our exports and throw away main's `DB`/hook architecture (defeats the
  point of merging), or
- take main's versions and break every web import that references the old API.

Neither is correct. The two refactors must be **reconciled deliberately**, not
merged mechanically.

## 4. Recommended strategy — staged reconciliation

Do **not** land one giant merge commit. Instead:

**Stage 0 — decide the target architecture (team call).** The core question:
does web adopt main's `DB.js` + shared-hooks architecture, or do we keep this
branch's standalone-service approach and re-express main's features on top of it?
Recommendation: **adopt main's architecture.** It's the more advanced, it's what
mobile will keep evolving, and the shared hooks are genuinely cross-platform
(they have no RN imports — verify per hook). Fighting it means permanent drift.

**Stage 1 — take main's shared layer wholesale.** On a fresh integration branch,
merge `origin/main` but for every conflicted file under `packages/shared`,
`functions/`, `firestore.rules`, `functions/package*.json`, and
`constants/status.ts`, **take main's version** (`git checkout --theirs`). Re-apply
only the two genuinely-ours fixes on top afterward:
- live follow counts (`getFollowCounts` via `getCountFromServer`) — port into
  main's `UsersService`.
- `createChatModel` arg-order fix — check whether main's chat rewrite already
  avoids it (main's `sendInitialOffer` may differ); re-apply only if still present.

**Stage 2 — reconcile the web app against the new shared API.** This is the real
work. For each web page that imports a shared service, update it to the new
`UsersService.*` / `DB` / hook API. Expect to touch: Profile, PublicProfile,
Chat, Map/Explore, Events, Books, BlockedUsers. Resolve the 3 web conflicts
main already created (`Events/Details.jsx`, `Profile/BlockedUsers.jsx`,
`AppRouter.jsx`).

**Stage 3 — port features to web UI, one PR each** (see §6 ordering).

**Stage 4 — verify** each feature in the browser preview; `vite build` gate.

## 5. Chat-deletion finding (resolves the earlier mystery)

`main` ships **`purgeInactiveChats`** (`functions/index.js:326`) — an
`onSchedule("0 0 * * *")` cron that `recursiveDelete()`s every chat with
`updatedAt <= now-30d`, daily. Once deployed to the shared project it runs
server-side regardless of client branch. Notes:

- The 30-day cutoff does **not** match the "messages gone after ~2h" report, so
  this cron is likely not what erased the *recent* test messages — but it IS a
  live automated deletion path and explains older chats vanishing.
- **Type-consistency bug:** web writes chat `updatedAt` as an ISO **string**;
  main/mobile writes Firestore **Timestamps**. The cron compares against a
  `Timestamp`, and Firestore's cross-type ordering means string vs timestamp
  `updatedAt` do not compare as intended — the cron behaves inconsistently
  across web- and mobile-created chats. Reconcile on the timestamp
  representation (adopt `serverTimestamp()`, which main's `DB` already uses).
- main also added **per-user soft-delete** (`hiddenFor` array on the chat;
  `sendTextMessage` resets it to `[]`). Web's inbox query must respect
  `hiddenFor` once merged, or deleted-on-mobile chats will reappear on web.

## 6. Suggested web port order (after Stages 0–2)

1. **Notifications feed** — read-only `users/{uid}/notifications`; low risk, high
   visibility, exercises the new `DB`/hook path once.
2. **Gamification / literary levels** — mostly display of `gamification.rank`;
   badge PNGs already in `shared/assets/badges`.
3. **Follow requests** — extends the follow flow we already have on web.
4. **Recent searches + explore filters** — build on existing Explore page.
5. **Infinite scroll** — swap Explore/Users lists onto `use-paginated-list`.
6. **Chat redesign + soft-delete** — align web chat with `hiddenFor` + timestamp
   fixes; must land with the §5 reconciliation.
7. **Swap flow (QR/counter/review)** — largest; QR scan needs a web camera lib.
8. **Push notifications** — web needs FCM web push (service worker) — separate
   spike; lowest priority, most platform-specific.

## 7. Open decisions for the team

- Adopt main's `DB` + shared-hooks architecture on web? (Stage 0) — **blocks everything.**
- TypeScript: main's hooks are `.ts`. Web is currently JS + Vite. Confirm Vite
  resolves the shared `.ts` hooks (it should via esbuild) before relying on them.
- Who owns redeploying `functions/` + `firestore.rules` to the shared project,
  and when (needs team approval per `CLAUDE.md`).
- Timestamp reconciliation for `chats.updatedAt` is a **prerequisite** for
  turning `purgeInactiveChats` loose safely.
