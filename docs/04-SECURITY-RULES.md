# Security rules

File: `firestore.rules`. Cloud-side. Cannot be bypassed by a hostile client.

## Helper functions

| Function | Meaning |
|----------|---------|
| `isAuthenticated()` | `request.auth != null` — caller is signed in |
| `isOwner(userId)` | Caller's UID == `userId` |
| `getMyProfile()` | `get()` the caller's own user doc (costs 1 Firestore read) |
| `isAdmin()` | `getMyProfile().role == 'admin'` |
| `isBackOfficer()` | `getMyProfile().role == 'back_officer'` |
| `isActive()` | `getMyProfile().accountStatus == 'active'` |

> `isAdmin()`, `isBackOfficer()`, and `isActive()` each call `getMyProfile()`.
> Firestore memoises `get()` within the same request, so the doc is fetched
> once per rule evaluation regardless of how many helpers use it. If admin
> actions become very frequent, move the role onto a custom auth claim to
> eliminate the doc read entirely.

---

## `/users/{userId}`

| Op | Allowed when |
|----|--------------|
| **read** | `isOwner(userId)` OR (`isAuthenticated() && isActive()`) |
| **create** | `isOwner(userId) && role == 'user' && accountStatus == 'active'` — zero trust, no self-promotion to admin |
| **update** | (owner + active + cannot touch `role` or `accountStatus`) OR `isAdmin()` |
| **delete** | `isAdmin()` only |

### `/users/{userId}/favoriteBooks/{bookId}` and `/myBooks/{bookId}`

| Op | Allowed when |
|----|--------------|
| **read/write** | `isOwner(userId) && isActive()` — strictly private to the owner |

---

## `/books/{bookId}`

| Op | Allowed when |
|----|--------------|
| **read** | `isAuthenticated() && isActive()` — entire catalog visible to active members |
| **create** | `isAuthenticated() && isActive() && addedBy == caller uid` |
| **update** | (original adder + active + cannot touch `addedBy` or `createdAt`) OR `isAdmin()` OR `isBackOfficer()` |
| **delete** | `isAdmin()` OR `isBackOfficer()` |

---

## `/events/{eventId}`

| Op | Allowed when |
|----|--------------|
| **read** | `isAuthenticated() && isActive()` |
| **create** | `isAuthenticated() && isActive() && ownerId == caller uid` |
| **update** | (owner + active + cannot touch `ownerId` or `createdAt`) OR `isAdmin()` OR `isBackOfficer()` |
| **delete** | `isAdmin()` OR `isBackOfficer()` |

### `/events/{eventId}/attendees/{attendeeId}`

Doc ID is the attendee's UID.

| Op | Allowed when |
|----|--------------|
| **read** | `isAuthenticated() && isActive()` |
| **create** | `isOwner(attendeeId) && isActive()` — users join themselves |
| **delete** | `isOwner(attendeeId)` (leave) OR `isAdmin()` OR `isBackOfficer()` (kick) |

### `/events/{eventId}/messages/{msgId}`

| Op | Allowed when |
|----|--------------|
| **read** | `isAuthenticated() && isActive()` |
| **create** | `isAuthenticated() && isActive() && senderId == caller uid` |
| **delete** | (sender + active) OR `isAdmin()` OR `isBackOfficer()` (moderation) |

Note: message editing is intentionally not permitted — append-only chat.

---

## `/publications/{publicationId}`

| Op | Allowed when |
|----|--------------|
| **read** | `isAuthenticated()` |
| **create** | `isAuthenticated() && uid == caller uid` |
| **update** | Owner (any field), OR any authenticated caller changing only `status` (lets either party in a trade flip `available`/`reserved`), OR an active user changing only `stats` |
| **delete** | Not defined in rules — deletion goes through `PublicationService.deletePublication`, which checks ownership and `status == 'available'` in application code, not rules |

## `/chats/{chatId}` and `/chats/{chatId}/messages/{messageId}`

| Op | Allowed when |
|----|--------------|
| **read, update** (chat doc) | `isAuthenticated() && isActive()` + caller is in `participants` |
| **create** (chat doc) | `isAuthenticated() && isActive()` + caller is in `participants` |
| **read, write** (messages) | `isAuthenticated() && isActive()` + caller is in the parent chat's `participants` |

There's no `/trades/{tradeId}` collection — a rules block for one exists in an
earlier commit of this file but was removed as unused. Book exchanges are
negotiated as offer messages inside a chat and resolved by updating the
message's `offerDetails.status` plus the publication's `status`; see
[03-FIRESTORE-MODEL.md](03-FIRESTORE-MODEL.md#book-exchanges-publications--chat-embedded-offers).

---

## Local testing

```bash
firebase emulators:start --only firestore
```

Try writes that **should fail** and confirm they are rejected:
- Sign up with `role: 'admin'` → must be rejected
- Read another user's `myBooks` subcollection → must be rejected
- Create a trade with `offeredBy` set to someone else's uid → must be rejected
- Send a message with `senderId` set to someone else's uid → must be rejected
