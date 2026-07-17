# Book exchange (trade) module — implementation plan

> **Status: superseded.** This plan (open-shelves discovery + a standalone
> `trades/{tradeId}` collection) was never implemented — the team instead built
> a richer model: users explicitly list books as `publications`, and the whole
> negotiation (offers, counter-offers, in-person verification, reviews) happens
> as messages inside a `chats` thread. The `trades` collection, its rules, and
> `services/trades.web.js` were dead code and have been removed. See
> [03-FIRESTORE-MODEL.md](03-FIRESTORE-MODEL.md#book-exchanges-publications--chat-embedded-offers)
> for how it actually works, and `packages/shared/src/services/{chat,trades,publications}.js`
> for the implementation. This doc is kept for historical context only — don't
> pick up the plan below.

## Context (historical — describes the superseded plan)

The app lets users build a private shelf (`users/{uid}/myBooks`) but there's no way to
exchange books with other members. The `trades/{tradeId}` collection and its security
rules already exist in the schema ([03-FIRESTORE-MODEL.md](03-FIRESTORE-MODEL.md),
`firestore.rules`), but nothing reads or writes them, and there's a **discovery gap**:
`myBooks` is currently "strictly private to the owner," so User A can't even see that
User B owns a book worth requesting.

This implements the full exchange loop using the **open-shelves** discovery model
(chosen): relax `myBooks` so any active member can read it, discover tradable books with a
collection-group query, then drive the existing `trades` schema through
request → accept/decline → complete.

The `trades` schema and rules already support this loop unchanged — the only rule change
needed is making `myBooks` readable by active members.

### Decisions locked

- **Discovery model:** open shelves (any active member reads others' `myBooks`; discover via
  collection-group query). `favoriteBooks` stays private.
- **Scope:** full loop — browse available books → request → incoming/outgoing inbox →
  accept / decline / complete.

---

## 1. Security rules + docs (the only schema-policy change)

**`firestore.rules`** — `users/{userId}/myBooks/{bookId}`: split read from write.
- read: `isAuthenticated() && isActive()` (was `isOwner(userId) && isActive()`)
- write: unchanged — `isOwner(userId) && isActive()`

`favoriteBooks` stays fully private. `trades/{tradeId}` rules are **already correct** for
the full loop (create requires `offeredBy == uid`; either party may update status without
touching `bookId`/`offeredBy`/`requestedFrom`/`createdAt`; read limited to the two parties
or admin) — no change.

**Docs:** update the `myBooks` read row in [04-SECURITY-RULES.md](04-SECURITY-RULES.md) and
the privacy note under `users/{uid}/myBooks` in [03-FIRESTORE-MODEL.md](03-FIRESTORE-MODEL.md)
to say active members can read shelves for trade discovery (favorites remain private).

**Deploy:** `npx firebase-tools deploy --only firestore:rules`. Rules are inert until deployed.

---

## 2. Shared services (mobile `.js` + web `.web.js`, per the established pattern)

Each service needs both variants importing `./firebase` vs `./firebase.web` — same split as
`books.js` / `books.web.js` and `booksCatalog.js` / `booksCatalog.web.js`.

**`packages/shared/src/services/trades.js` + `trades.web.js`**
- `createTrade({ bookId, offeredBy, requestedFrom })` — `addDoc(collection(db,'trades'), { ...,
  status: 'pending', createdAt, updatedAt })` (ISO strings, per schema conventions).
- `getIncomingTrades(uid)` — `where('requestedFrom','==',uid)`, sort by `createdAt` desc in JS
  (no `orderBy`, so no composite index needed).
- `getOutgoingTrades(uid)` — `where('offeredBy','==',uid)`, same.
- `updateTradeStatus(tradeId, status)` — `updateDoc` setting `status` + `updatedAt`.
- `getAvailableTradeBooks(excludeUid)` — `getDocs(collectionGroup(db,'myBooks'))`; for each
  doc, owner uid = `docSnap.ref.parent.parent.id`; filter out `excludeUid`; return
  `[{ bookId, ownerId, addedAt }]`.

**`packages/shared/src/services/users.js` + `users.web.js`** (new — no user service exists yet)
- `getUsersByIds(uids)` — chunk by 10, `where(documentId(),'in',chunk)`, return
  `{ [uid]: { username, fullName } }`. Mirrors the chunking in
  `booksCatalog.web.js:getBooksByIds`. Used to show who owns each available book.

Reuse `getBooksByIds` from `booksCatalog.web.js` to hydrate titles/covers for the browse list
and for trade cards.

---

## 3. Web UI

**Routing**
- `apps/web/src/constants/webRoutes.js` — add `TRADES: '/trades'`.
- `apps/web/src/routes/AppRouter.jsx` — add `<Route path={WEB_ROUTES.TRADES} element={<Trades />}>`
  inside the `AppShell`/`RequireAuth` group.
- `apps/web/src/components/AppShell.jsx` — add a nav item `{ to: WEB_ROUTES.TRADES,
  label: 'Trades', Icon: ArrowLeftRight }` (import `ArrowLeftRight` from `lucide-react`,
  matching the existing icon pattern).

**`apps/web/src/pages/Trades/index.jsx`** — tabbed page: **Browse | Incoming | Outgoing**.
- On mount, load in parallel: `getAvailableTradeBooks(uid)`, `getIncomingTrades(uid)`,
  `getOutgoingTrades(uid)`. Hydrate book details via `getBooksByIds` and owner names via
  `getUsersByIds` (collect unique uids across all three lists).
- **Browse**: list `AvailableBookCard`s. "Request trade" calls `createTrade`; disable the
  button when an outgoing pending trade already exists for that `(bookId, ownerId)`
  (derived from the loaded outgoing list).
- **Incoming**: pending → Accept (`accepted`) / Decline (`declined`); accepted → Mark
  complete (`completed`).
- **Outgoing**: pending → Cancel (`declined`); shows current status otherwise.
- Optimistic status updates with revert on error — same pattern as
  `apps/web/src/pages/Books/index.jsx`. Use `Spinner`, `ErrorAlert`, `Button` throughout.

**Components** (mirror `Books/components/BookCard` structure + CSS-module conventions)
- `Trades/components/AvailableBookCard.jsx` (+ `.module.css`) — cover/placeholder, title,
  authors, owner name, "Request trade" button (`busy`/`disabled` states).
- `Trades/components/TradeRequestCard.jsx` (+ `.module.css`) — cover, title, the other
  party's name, a status badge, and context-appropriate action buttons.

---

## 4. Indexes

Trade queries are single-field equality (`requestedFrom` / `offeredBy`) — auto-indexed, no
composite index. The collection-group query on `myBooks` may require a one-time
collection-group index; if `getAvailableTradeBooks` throws a `FAILED_PRECONDITION` with a
console link, follow it (or add a `myBooks` collection-group entry to
`firestore.indexes.json` and deploy).

---

## Verification

Needs **two accounts** (Ana + a second test account or a teammate's).

1. Deploy rules: `npx firebase-tools deploy --only firestore:rules`.
2. Build passes: `cd apps/web; npx vite build`.
3. Dev server (preview `web`, port 5200). As account B, add a couple of books to My Books.
4. As account A, open **Trades → Browse**: B's books appear with B's name. Click **Request trade**
   → button disables; the request shows under **Outgoing** as pending.
5. As account B, **Trades → Incoming**: the request is listed. **Accept** → status flips to
   accepted (check Firestore console: `trades/{id}.status == 'accepted'`, `updatedAt` set).
6. Either account **Mark complete** → `completed`. As A, **Decline/Cancel** path → `declined`.
7. Confirm an active member can read another user's `myBooks` but still cannot read their
   `favoriteBooks` (rules unchanged there).
8. Check the preview console for permission or index errors.

---

## Critical files

**Create**
- `packages/shared/src/services/trades.js` + `trades.web.js`
- `packages/shared/src/services/users.js` + `users.web.js`
- `apps/web/src/pages/Trades/index.jsx` + `Trades.module.css`
- `apps/web/src/pages/Trades/components/AvailableBookCard.jsx` (+ css)
- `apps/web/src/pages/Trades/components/TradeRequestCard.jsx` (+ css)

**Modify**
- `firestore.rules` — `myBooks` read rule
- `apps/web/src/constants/webRoutes.js`, `routes/AppRouter.jsx`, `components/AppShell.jsx`
- `docs/03-FIRESTORE-MODEL.md`, `docs/04-SECURITY-RULES.md`

**Reuse**
- `booksCatalog.web.js:getBooksByIds` (hydrate + chunk pattern)
- `Books/index.jsx` optimistic-update/revert pattern
- `components/{Spinner,ErrorAlert,Button}.jsx`, `Books/components/BookCard` structure
