# Firestore data model

## `users/{uid}`

Created on first sign-up by `saveUserData` in `packages/shared/src/services/auth.js`.
Shape produced by `createUserModel` in `packages/shared/src/models/user.js`.

| Field | Type | Source / values |
|-------|------|-----------------|
| `uid` | string | Firebase Auth UID |
| `userId` | string | `email.trim().toLowerCase()` — stable email-as-ID |
| `username` | string | user-chosen |
| `fullName` | string | from sign-up form |
| `phoneNumber` | string | from sign-up form |
| `dob` | string | ISO date |
| `profileVisibility` | enum | `'public'` \| `'private'` |
| `role` | enum | `'user'` \| `'back_officer'` \| `'admin'` |
| `accountStatus` | enum | `'active'` \| `'suspended'` \| `'pending'` |
| `institutionalAddress` | object | `{ addressLine1, addressLine2, city, district, postalCode, country }` |
| `createdAt` | string | ISO timestamp |
| `authProvider` | enum | `'email'` \| `'google'` |

Constants in `packages/shared/src/constants/authConstants.ts`. **Always import
those — never hardcode the strings.**

### `users/{uid}/favoriteBooks/{bookId}`

Per-user list of bookmarked books. Managed by `favoriteBooksService` in
`packages/shared/src/services/books.js`.

| Field | Type | Notes |
|-------|------|-------|
| `bookId` | string | doc ID = the `books/{bookId}` key |
| `addedAt` | string | ISO timestamp |

### `users/{uid}/myBooks/{bookId}`

Books the user owns / is willing to trade. Managed by `myBooksService` in
`packages/shared/src/services/books.js`.

| Field | Type | Notes |
|-------|------|-------|
| `bookId` | string | doc ID = the `books/{bookId}` key |
| `addedAt` | string | ISO timestamp |

---

## `books/{bookId}`

Global book catalog. Doc ID is the ISBN when available (so barcode scans
dedupe automatically); otherwise a Firestore auto-ID.

| Field | Type | Notes |
|-------|------|-------|
| `isbn` | string \| null | also used as doc ID when present |
| `title` | string | |
| `authors` | array of strings | |
| `coverUrl` | string \| null | remote image URL |
| `addedBy` | string | uid of whoever first added it |
| `createdAt` | string | ISO timestamp |

Personal data (ratings, reading status) does **not** go here — it belongs in
`users/{uid}/myBooks/{bookId}` or `users/{uid}/favoriteBooks/{bookId}` so two
users don't collide on the same document.

---

## `events/{eventId}`

Community events (reading groups, lectures, roundtables). Firestore auto-ID.

| Field | Type | Notes |
|-------|------|-------|
| `ownerId` | string | uid of the organiser |
| `title` | string | |
| `description` | string | |
| `type` | enum | `'reading'` \| `'lecture'` \| `'roundtable'` |
| `startsAt` | string | ISO datetime |
| `location` | object | `{ label, lat, lng }` — embedded (always loaded with event) |
| `attendeeCount` | number | denormalised for list views; update with the attendee doc write |
| `createdAt` | string | ISO timestamp |

### `events/{eventId}/attendees/{uid}`

One doc per user who has joined. Doc ID = the attendee's UID.

| Field | Type | Notes |
|-------|------|-------|
| `joinedAt` | string | ISO timestamp |

### `events/{eventId}/messages/{msgId}`

Per-event chat. Firestore auto-ID. Sort by `createdAt` ascending.

| Field | Type | Notes |
|-------|------|-------|
| `senderId` | string | uid |
| `senderName` | string | denormalised — avoids a user lookup on every message render |
| `text` | string | |
| `createdAt` | string | ISO timestamp |

---

## Book exchanges: `publications` + chat-embedded offers

There is no standalone `trades` collection — an earlier plan for one
([docs/12-TRADE-MODULE-PLAN.md](12-TRADE-MODULE-PLAN.md)) was superseded before
it shipped, and the schema/rules that plan added were never read or written by
either client. The real exchange loop is:

### `publications/{publicationId}`

A book a user has listed for trade (richer than a raw `myBooks` entry — title,
condition, photos, description). Doc ID is `{uid}_{timestamp}`.

| Field | Type | Notes |
|-------|------|-------|
| `uid` | string | owner's uid |
| `book` | object | `{ title, author, images[], bookId, condition, subject }` |
| `detailsText` | string | free-text description |
| `sellerName` / `sellerAvatar` | string | denormalised owner display info |
| `status` | enum | `PUBLICATION_STATUS`: `'available'` \| `'reserved'` \| `'swapped'` |
| `stats.likesCount` | number | denormalised favorite count |
| `createdAt` | string | ISO timestamp |

### `chats/{chatId}/messages/{messageId}` (`type: 'offer'`)

The offer itself, and the entire negotiation, lives as a message inside the
chat thread between the two users — there's no separate "offer" or "trade"
document. `offerDetails` on the message holds:

| Field | Type | Notes |
|-------|------|-------|
| `targetBookId` / `targetBookImage` | string | the publication being requested |
| `offeredBooks` | array | snapshot of the books offered in exchange: `[{ id, title, image }]` |
| `offeredBookIds` | array of strings | ids only, for querying |
| `finalSelectedBookId` / `finalSelectedBookImage` | string \| null | which offered book was actually agreed on |
| `status` | enum | `NEGOTIATION_STATUS`: `'pending'` \| `'accepted'` \| `'declined'` \| `'canceled'` \| `'unavailable'`, plus the ad hoc `'countered'` / `'completed'` used on the message |
| `isCounter` | boolean | true if this message is a counter-proposal |
| `location` | object | `{ id, title, address, latitude, longitude }` — meeting spot |
| `verificationCode` / `verificationDisplayerId` / `verificationScannerId` / `verifiedAt` | — | in-person handshake, set once accepted |
| `cancelledBy` | string \| null | uid of whoever cancelled an accepted swap |

`packages/shared/src/services/chat.js` (`ChatService`) creates/updates these
messages (`sendInitialOffer`, `sendCounterOffer`, `updateOfferStatus`,
`chooseBookFromOffer`, `declineOfferAndReofferRemaining`, `completeSwap`).
`packages/shared/src/services/trades.js` (`TradeService`) is a thin coordinator
on top — on accept it reserves both books (`publications.status = 'reserved'`);
on cancel it releases them back to `'available'`. It never creates its own
Firestore documents; "resolving a trade" just means updating the offer message
and the publication status together.

---

## Schema conventions

- Doc IDs are the Firestore keys, not fields (exception: `uid` is stored too for
  convenience; `bookId` is stored in subcollection entries as a convenience).
- All enums use lowercase strings.
- Timestamps are ISO strings, not Firestore `Timestamp` — consistent with the
  rest of the codebase and easier to log.
- Embed small data always read with the parent (e.g. event `location`).
  Use a subcollection for lists that grow unbounded or are read separately
  (attendees, messages, per-user books).
- Write the security rule alongside the schema (see [04-SECURITY-RULES.md](04-SECURITY-RULES.md)).
- Don't rename fields without a migration plan — mobile already reads them.
