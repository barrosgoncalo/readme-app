# Web/mobile reconciliation — what changed

**Branch:** `integration/main-merge-anaom`
**Related plan:** `docs/PLAN_WEB_MOBILE_MERGE.md` (the original investigation that
motivated this work), `docs/PLAN_SHELF_MY_BOOKS.md` (Shelf/My Books split,
folded into this changelog)

This documents the work done to reconcile web against `main`'s mobile-team
shared-layer rewrite, without touching anything mobile depends on. Nothing in
this changelog has been committed to git yet — it's all sitting as working-tree
changes on this branch.

## 1. Shared services reconciliation

`packages/shared` and `functions` were brought in line with `main` (which had
moved forward independently: `DB.js` hardening, delete-account support,
gamification/status tweaks, new hooks, admin/reports scaffolding), while
preserving every web-only addition (Shelf CRUD helpers, follow-system UI
support, trade-offer chat extensions, block/relationship models, the `.web.js`
platform-split files).

- **`services/chat.js`, `models/book.js`** — hand-merged (both sides had
  touched them). Verified line-by-line that both main's additions (deleted-user
  chat handling) and web's additions (`streamUserChats`, `streamMessages`,
  `completeSwap`, `chooseBookFromOffer`, `declineOfferAndReofferRemaining`) are
  present.
- **`firestore.rules`** — took main's version (adds admin/reports rules) and
  re-applied web's deletion of the dead `/trades/{tradeId}` block. Not
  deployed.
- **`services/users.js`, `services/reviews.js`** — ⚠️ these were initially
  missed during the "restore web's one-sided files" step and got silently
  overwritten with main's untouched base versions, deleting `getFollowCounts`,
  `getFollowing`, `getFollowers`, `hasUserReviewed`, `submitReview`. This
  crashed the entire Profile page (`UsersService.getFollowCounts is not a
  function`). Found via live testing, not the build — **the build stayed green
  the whole time this was broken.** Fixed by restoring both files verbatim
  from before the reconciliation (confirmed `main` never touched either file,
  so this was a safe direct restore, not a merge).
- **`services/firebase.web.js`** — added the missing `functions` export
  (`getFunctions(app, 'europe-west1')`), matching mobile's `firebase.js`.
  Fixes `CloudFunctions.call` / `ChatService.verifySwapCode`.
- **`services/booksCatalog.web.js`** — added `getBookByIsbn` (moved out from
  under `hydrateMyBooks`'s old import path during main's `books.js` rewrite).
- **`utils/hydrateMyBooks.js`** — fixed its `getBookByIsbn` import path.

## 2. Shelf/Favorites migration to `books.js`

`main` rewrote `packages/shared/src/services/books.js` with a new
architecture: a `BookCollectionService` class (`MyBooksService`/
`FavoriteBooksService` instances) backed by a global `books` cache collection
plus a per-user tracking-link subcollection, replacing the old flat
`myBooksService`/`favoriteBooksService` singletons.

Discovery mid-session: a pre-existing, untouched `services/books.web.js` shim
(identical on both `main` and this branch, never diffed by our earlier
reconciliation pass) still had the *old* API — and because Vite's `.web.js`-
first resolution silently preferred it, web had been running on the stale
shim the whole time, unaffected by main's rewrite. This meant our original
concern ("web's Shelf is broken by main's rewrite") was a false alarm, but it
also meant web was stuck on old code with no visibility into the gap.

Migrated web to use `books.js` directly (deleted `books.web.js`):
- `pages/Books/index.jsx`, `pages/Books/BookDetail.jsx`,
  `pages/Offers/NewOffer.jsx`, `pages/Users/PublicProfile.jsx` — updated to
  the new method names (`getBooksData`→`getBooks`, `addBook`→
  `saveBookToShelf`, `removeBook`→`deleteBook`) and the new nested
  `{ ...trackingDoc, bookDetails }` return shape (via local `flattenShelfDoc`
  helpers, kept per-file rather than added to a shared file).
- Confirmed `react-native-image-colors` (used by `saveBookToShelf` for cover
  color extraction) is already safely neutralized on web via an existing Vite
  alias + stub (`apps/web/src/shims/react-native-image-colors.js`) that
  rejects, which `books.js`'s own try/catch already handles gracefully.
- **Bug found and fixed during live testing**: `models/book.js`'s
  `createUserBookModel` calls `serverTimestamp()`, but the file had no import
  for it — an earlier reconciliation decision incorrectly kept web's *original*
  file (which never had the import) instead of main's (which does). Discovered
  via a silently-failing favorite toggle (`ReferenceError: serverTimestamp is
  not defined`, caught by a bare `catch {}` with no logging). Fixed by adding
  the import; added error logging to the catch block so this class of failure
  is visible next time.
- Live-verified end-to-end against real Firestore: add book, toggle favorite,
  rate a book, remove a book — all confirmed to persist after a full reload.

## 3. Shelf vs. My Books separation (`docs/PLAN_SHELF_MY_BOOKS.md`)

Web had conflated two concepts mobile keeps separate: **Shelf** (personal
reading list) and **My Books** (the user's own trade publications).

- Renamed "My Books" label to "Shelf" in the sidebar nav and page heading.
  Kept the `/books` URL and `WEB_ROUTES.BOOKS` constant as-is (labels only).
- Built the actual **My Books** page (`pages/Profile/MyBooks.jsx`, new route
  `/profile/my-books`) — the previously-missing view of the user's own
  publications, following the existing `Favorites.jsx` pattern
  (`PublicationService.fetchUserPublications` + `PublicationCard` grid +
  `EmptyState`/`SkeletonGrid`).
- Fixed `ProfileLayout.jsx`'s three stale references (settings menu item,
  stats row, quick-actions bar) to point at the right destination.
- **Fixed a real functional bug**: `NewOffer.jsx` was sourcing "books I can
  offer in a trade" from the Shelf instead of from the user's own
  publications — meaning the offer flow let users offer personal
  reading-list books instead of their actual trade listings, unlike mobile.
  Now sources via `PublicationService.fetchUserPublications(uid)`, with the
  `imageUrl`→`coverUrl` field normalization `OfferStep1.jsx` expects.
- Deleted dead code: `pages/Profile/index.jsx` (confirmed unreachable,
  not wired into `AppRouter.jsx`).
- Live-verified: Profile page, My Books empty state + CTA, and confirmed the
  offer flow's Step 1 now correctly reflects an empty My Books instead of
  showing Shelf books.
- Updated `CLAUDE.md` and `docs/03-FIRESTORE-MODEL.md` to document the
  distinction going forward.

## 4. Small UX/consistency fixes

- Shelf's filter pill renamed "Favorites" → "**Liked Books**" (plus matching
  button tooltips), to avoid confusion with Profile's separate Favorites tab
  (which favorites *publications*, a different concept from liked Shelf
  books).
- Replaced heart **emoji** (❤️) with the `lucide-react` `Heart` **icon** in
  `PublicationCard.jsx` and `PublicationDetails.jsx`'s like-count displays.
  (Left the chat emoji picker's heart emoji options alone — those are
  user-selectable message content, not app UI chrome.)
- **Fixed the swap verification-code input**: it was a plain `<input>` +
  separate `onClick` button with no `<form>` wrapper and no Enter-key
  handling — pressing Enter silently did nothing. Wrapped in a
  `<form onSubmit>` with a `type="submit"` button so Enter now submits like
  clicking Confirm does. Root-caused directly from a user report ("I typed
  the code, pressed Enter, nothing happened").

## Net effect

Web's shared-layer consumption is now current with `main`, the Shelf/My Books
architecture matches mobile's, and every fix above was verified live against
real Firestore data in the browser — not just build-green. See
`docs/RECONCILIATION_TODO.md` for what's still open.
