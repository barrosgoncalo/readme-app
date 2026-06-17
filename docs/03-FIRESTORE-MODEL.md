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

## `trades/{tradeId}`

Book-exchange offer between two users. Firestore auto-ID.

| Field | Type | Notes |
|-------|------|-------|
| `bookId` | string | references `books/{bookId}` |
| `offeredBy` | string | uid making the offer |
| `requestedFrom` | string | uid of the book's owner |
| `status` | enum | `'pending'` \| `'accepted'` \| `'declined'` \| `'completed'` |
| `createdAt` | string | ISO timestamp |
| `updatedAt` | string | ISO timestamp — set on every status change |

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
