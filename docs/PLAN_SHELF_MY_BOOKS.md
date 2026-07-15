# Separate "Shelf" from "My Books" on web

> Status: planned, not yet implemented. Pick up next session.

## Context

Mobile keeps two book-related concepts strictly separate:

- **Shelf** — a personal reading list. Add books via Google Books/ISBN search
  or barcode scan, track `status` (reading/want/done), `progress`, `rating`.
  Backed by `users/{uid}/myBooks` (`MyBooksService`/`myBooksService`).
- **My Books** — the books a user has *published* as available for trade.
  Backed by the top-level `publications` collection filtered by `uid`
  (`PublicationService.fetchUserPublications`). These published books are what
  show up in Explore for other users, and what get offered when the user
  proposes a swap.

Web conflated the two: the current `/books` page ("Your Reading List") is
Shelf functionality, but it's labeled **"My Books"** in two places — the main
sidebar nav (`AppShell.jsx`) and the Profile menu (`ProfileLayout.jsx`) — and
there is no page at all for managing one's own publications. Worse, the
swap-offer flow (`NewOffer.jsx`) sources "books I can offer" from the Shelf
(`myBooksService.getBooksData`) instead of from the user's own publications,
which is a real functional bug, not just a naming one — mobile's equivalent
screen (`StepOneOfferScreen.js`) sources offerable books from
`PublicationService.fetchUserPublications(uid)`.

This plan fixes the naming (Shelf) and the missing page (My Books), rewires
the offer flow to the correct data source, and updates the docs so the
distinction is unambiguous for future work.

**Decision locked:** rename labels only — keep the `/books` URL,
`WEB_ROUTES.BOOKS` constant, and `apps/web/src/pages/Books/` folder name
as-is (mirrors mobile's own precedent: their `Shelf/` folder still contains a
file literally named `ReadingListScreen.js`). A full URL rename is explicitly
out of scope for this pass.

## Changes

### 1. Rename "Shelf" (labels/copy only)

- `apps/web/src/components/AppShell.jsx` — `NAV_ITEMS` entry
  `{ to: WEB_ROUTES.BOOKS, label: 'My Books', ... }` → label becomes `'Shelf'`.
  This is the main persistent sidebar nav — the most visible instance of the
  bug.
- `apps/web/src/pages/Books/index.jsx` — page heading text (currently "Your
  Reading List" or similar) → "Shelf".
- `apps/web/src/pages/Profile/ProfileLayout.jsx` — three separate "Books"/"My
  Books" references get disambiguated (see §3 below).
- Delete `apps/web/src/pages/Profile/index.jsx` — confirmed dead code (not
  imported by `AppRouter.jsx`, which wires `ProfileLayout.jsx` directly; no
  other file imports it either). It has the same stale "My Books → /books"
  pattern; rather than fix labels in unreachable code, just remove it.

### 2. New "My Books" page (Profile sub-route)

Follow the existing Profile sub-route pattern exactly (`Favorites.jsx` is the
closest template — same shape: fetch, render a grid of `PublicationCard`s,
`EmptyState`, `SkeletonGrid`).

- Add `WEB_ROUTES.PROFILE_MY_BOOKS = '/profile/my-books'` to
  `apps/web/src/constants/webRoutes.js`, next to the other `PROFILE_*`
  constants.
- New file `apps/web/src/pages/Profile/MyBooks.jsx` (+ CSS module if needed):
  - Fetch via `PublicationService.fetchUserPublications(currentUser.uid)`
    (`packages/shared/src/services/publications.js`) — already exists, no
    shared-layer changes needed.
  - Render each item as `PublicationCard` (`apps/web/src/pages/Map/components/PublicationCard.jsx`)
    for visual consistency with Explore. `PublicationCard` expects the **raw
    publication doc shape** (`pub.book.title`, `pub.status`, `pub.sellerName`,
    etc.), not the mapped summary — follow the exact pattern already used in
    `apps/web/src/pages/Map/index.jsx`: `summaries.map(s => s.publicationData)`
    before rendering.
  - Clicking a card already navigates to `WEB_ROUTES.publicationDetail(pub.id)`
    (built into `PublicationCard`), landing on the existing
    `PublicationDetails.jsx`, which already has an owner-aware delete button.
    No new detail/edit page needed for this pass.
  - `EmptyState` copy: "You haven't listed any books for trade yet" + CTA to
    `WEB_ROUTES.PUBLICATION_NEW`. `SkeletonGrid` while loading (both already
    imported elsewhere, e.g. `Map/index.jsx`).
  - Decision, low-stakes: `PublicationCard`'s favorite-heart toggle doesn't
    make sense on your own listings. Simplest fix: pass a prop to suppress it
    for My Books cards (or just leave it — not a blocker either way).
- Wire the route: add `WEB_ROUTES.PROFILE_MY_BOOKS` to the `SUB_ROUTES` Set in
  `ProfileLayout.jsx` (same set `PROFILE_FOLLOWING`/`PROFILE_FAVORITES`/etc.
  are already in, so it renders via the existing `Outlet` in the right
  column), and add a nested `<Route path="my-books" element={<MyBooks />} />`
  in `AppRouter.jsx` under the `WEB_ROUTES.PROFILE` route block, alongside the
  existing `following`/`followers`/`favorites`/`level`/`blocked-users` routes.

### 3. Fix `ProfileLayout.jsx`'s three stale "Books" references

- Settings menu item (Content group): `onClick: () => navigate(WEB_ROUTES.BOOKS)`
  → `navigate(WEB_ROUTES.PROFILE_MY_BOOKS)`. This is the primary fix — the
  literal bug the user described.
- Identity-card stats row ("Books" stat, currently uncounted `—`): relabel to
  "Shelf" and keep it pointing at `WEB_ROUTES.BOOKS` (it reads as a personal
  stat, not a trade-listing count).
- Quick-actions bar (`<Link to={WEB_ROUTES.BOOKS}>My Books</Link>`): split
  into two buttons — "Shelf" → `WEB_ROUTES.BOOKS`, "My Books" →
  `WEB_ROUTES.PROFILE_MY_BOOKS`.

### 4. Fix `NewOffer.jsx` — source offerable books from publications, not Shelf

Current (`apps/web/src/pages/Offers/NewOffer.jsx`):
```js
const [pub, myBookDocs] = await Promise.all([
    PublicationService.fetchPublication(pubId),
    myBooksService.getBooksData(uid)          // wrong: Shelf subcollection
]);
const books = await hydrateMyBooks(myBookDocs, { apiKey });
setMyBooks(books);
```

Target:
```js
const [pub, myPublications] = await Promise.all([
    PublicationService.fetchPublication(pubId),
    PublicationService.fetchUserPublications(uid)   // correct: user's own listings
]);
setMyBooks(myPublications);
```
This removes the need for `myBooksService`, `hydrateMyBooks`, and the Google
Books API round-trip in this file entirely — publications are already fully
hydrated (title/author/images inline).

**Field-shape fix required** (same bug class this app has hit before —
verified directly against the source, not just inferred): `OfferStep1.jsx`
renders `<BookCover coverUrl={book.coverUrl} .../>`, but
`fetchUserPublications`'s summary shape has `.imageUrl`, not `.coverUrl`.
Normalize in `NewOffer.jsx` when setting state
(`.map(b => ({ ...b, coverUrl: b.imageUrl }))`) rather than touching
`OfferStep1.jsx`'s prop contract. No other field mismatch — `chat.js`'s
`_formatOfferedBooks` fallback chain already checks `.imageUrl` (added in an
earlier session pass), so `ChatService.sendInitialOffer` needs no change.

Known gap, explicitly not fixing in this pass (pre-existing on both
platforms): `fetchUserPublications` doesn't filter out already-`reserved`/
`swapped` books, so a book mid-trade could still show as offerable. Mobile has
the same gap. Flag only.

### 5. Documentation

- **`CLAUDE.md`** — add a short paragraph near the existing routing bullet
  under "Web app conventions" stating the Shelf/My Books split plainly: Shelf
  = personal reading list (`/books`, `users/{uid}/myBooks`), My Books = own
  trade listings (`/profile/my-books`, `publications` filtered by `uid`).
  Explicitly: "don't use `myBooksService`/`WEB_ROUTES.BOOKS` when the intent
  is the user's published listings — use `PublicationService.fetchUserPublications(uid)`."
- **`docs/03-FIRESTORE-MODEL.md`**:
  - In the `users/{uid}/myBooks/{bookId}` section: append a sentence naming
    it as the Shelf backing store, contrasted with `publications` below.
  - In the existing `## Book exchanges: publications + chat-embedded offers`
    section: append to the `publications/{publicationId}` subsection that
    this also backs the **My Books** UI and is the source for the
    offer-creation flow's book-selection step — never `myBooks`.

## Verification

1. **Docs** — no build step; just re-read the diff for accuracy.
2. **Label rename** — run the web dev server (`npx vite` from `apps/web/`),
   log in, confirm the sidebar reads "Shelf", the `/books` page heading
   matches, and the URL is unchanged.
3. **New My Books page** — navigate to `/profile/my-books` directly; confirm
   it renders the current user's own publications as cards; click through to
   a detail page and confirm the existing delete button still works; confirm
   an empty account shows the empty state with a working "create publication"
   CTA.
4. **ProfileLayout wiring** — click Profile → "My Books" menu item → lands on
   the new page; identity-card "Shelf" quick action → lands on `/books`.
5. **Offer flow (highest-risk change)** — as one user, view another user's
   publication, click "Make an Offer": confirm Step 1 lists *published* books
   (not Shelf books) with real cover images (not broken/placeholder — this
   directly tests the `coverUrl`/`imageUrl` fix), select one, proceed, submit,
   and confirm the resulting chat offer message renders correctly.
6. **Regression spot-check** — Shelf add/scan/search flows untouched by this
   change (no logic touched, only labels); Explore/Map page untouched (no
   files there are touched) — quick click-through to confirm no regression.
7. `npx vite build` after each step to catch import/export errors early,
   consistent with how the rest of this session's work was verified.
