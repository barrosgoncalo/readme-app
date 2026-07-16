# Web/mobile reconciliation — what's still open

See `docs/RECONCILIATION_CHANGELOG.md` for what's already done. This is the
remaining work, ranked by how confident we are it's a real problem.

## Known bugs (confirmed, not yet fixed)

### 1. Offer messages show "Offered: Loading..." forever for single-book offers

**Root cause, confirmed in code:** `OfferMessage.jsx` resolves the single
offered book's title via a live `getBooksByIds([offer.offeredBookIds[0]])`
call against the `books` global catalog collection
(`packages/shared/src/services/booksCatalog.js`). Since the `NewOffer.jsx`
fix (see changelog §3), `offeredBookIds` now hold **publication IDs**, not
`books` catalog doc IDs — so the lookup always returns empty, `singleBook`
never resolves, and the title never leaves its `'Loading...'` fallback.

**Suggested fix:** the offer message already embeds a full snapshot at
send-time — `offer.offeredBooks[0].title` / `.image` (`_formatOfferedBooks` in
`chat.js`, stored via `createOfferModel`). `OfferMessage.jsx`'s single-book
branch should prefer that embedded snapshot instead of re-fetching from the
`books` catalog. This avoids a live lookup entirely for the common case.
Multi-book offers (the "Choose a book" modal) already read from
`getBooksByIds` in a different code path — check whether that path has the
same ID-space mismatch before assuming it's fine.

### 2. Firestore rules allow bypassing the swap verification-code check

`firestore.rules`'s `chats/{chatId}/messages/{messageId}` rule lets **any**
chat participant write **any** field on a message doc — there's no
restriction limiting who can flip `offerDetails.status` to `'completed'`.
Web's `ChatService.completeSwap` writes this directly from the browser after
a client-side code comparison; nothing server-side actually enforces the
check. Confirmed this is **not** a web-specific regression — mobile's
`verifySwapCode` Cloud Function path doesn't close this gap either, since the
rules would still permit a direct client write that skips the function
entirely. Pre-existing on both platforms. Flagging only; not fixing without
a product decision on how much this matters (test/trust-based app vs. one
that needs to resist a malicious client).

### 3. Chat auto-scrolls to bottom on every message list update

Confirmed during verification-code testing: interacting with an action card
(entering a code, etc.) can trigger a re-render that scrolls the view back to
the newest message, even if the user was scrolled up looking at an older
offer card. Not confirmed as a bug in the strict sense (may be intentional
"jump to latest" behavior), but it did make the verification flow
confusing to test — a completed/failed state could scroll out of view right
after the action that caused it. Worth a UX pass if it comes up again.

## Latent risk (not broken today, just a trap)

### `gamification.web.js` may be a fully redundant duplicate of `gamification.ts`

`gamification.ts`'s badge PNG imports use plain ES `import`, which Vite
supports natively — the `.web.js` sibling might not be necessary at all
(unlike `books.web.js`, which existed for a real reason — see changelog). If
confirmed redundant, retiring it removes a second silent-drift trap: today
the data is identical on both files, but nothing enforces that going forward,
and Vite's `.web.js`-first resolution means any future edit to
`gamification.ts` would silently never reach web. Same failure mode as the
`books.web.js` situation, just not yet triggered.

## Reconciled but never live-tested end-to-end

These were verified by export/shape comparison only (the same method that
missed the `users.js`/`reviews.js` regression — see changelog §1). Live-test
before trusting them:

- **Publications**: create-with-image flow untested (no file-upload
  capability in the browser tooling used this session — needs a manual pass).
  Browse/detail/delete were exercised incidentally while testing other flows
  and looked fine, but not deliberately exercised.
- **Trades/offers beyond the single case tested**: multi-book offer selection
  (the "Choose a book" modal — `chooseBookFromOffer`), decline-and-reoffer-
  remaining, and swap cancellation (`cancelSwap`) are all implemented but
  unverified live.
- **Auth flows**: login, register, Google sign-in, password reset/change,
  delete account — none re-tested since the shared-layer reconciliation.
- **Reviews**: `hasUserReviewed`/`submitReview` were the two functions lost
  and restored in `reviews.js` (changelog §1) — the "Rate this swap" UI
  appeared correctly in the one live test we did, but submitting a review
  hasn't been explicitly confirmed to persist.

## Deferred by explicit decision (not a gap, just not started)

- **Admin panel / router split** — building the role-based router that
  serves both the consumer app and the admin panel from one `apps/web` is
  intentionally paused until the above is solid. Tracked separately; admin
  work itself lives on `refactor/web`.
- **Stage 3 feature ports** from `docs/PLAN_WEB_MOBILE_MERGE.md` §6 — not
  started this session: notifications feed, follow requests, recent
  searches + explore filters, infinite scroll (`use-paginated-list`), push
  notifications (needs a web FCM service-worker spike). QR-code swap
  verification was explicitly decided against for web in favor of manual
  code entry (already implemented) — not a gap, a deliberate platform
  difference.

## Housekeeping

- **Nothing from this reconciliation is committed yet** — it's all
  working-tree changes on `integration/main-merge-anaom`. Decide commit
  granularity (one commit vs. several) before pushing.
- `firestore.rules` changes are local-only per the project's deploy-requires-
  team-approval rule — don't `firebase deploy` without sign-off.
