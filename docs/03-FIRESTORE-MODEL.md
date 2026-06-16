# Firestore data model

## `users/{uid}`

Created on first sign-up by `saveUserData` in `packages/shared/src/services/auth.js`.

| Field | Type | Source / values |
|-------|------|-----------------|
| `uid` | string | Firebase Auth UID |
| `userId` | string | `email.trim().toLowerCase()` — stable email-as-ID |
| `username` | string | user-chosen |
| `fullName` | string | from sign-up form |
| `phoneNumber` | string | from sign-up form |
| `dob` | string | ISO date |
| `profileVisibility` | enum | `'public'` \| `'private'` (lowercase) |
| `role` | enum | `'user'` \| `'back_officer'` \| `'admin'` |
| `accountStatus` | enum | `'active'` \| `'suspended'` \| `'pending'` |
| `institutionalAddress` | object | `{ addressLine1, addressLine2, city, district, postalCode, country }` |
| `createdAt` | string | ISO timestamp |
| `favoriteBooks` | array | initially `[]` |
| `authProvider` | enum | `'email'` \| `'google'` |

Constants in `packages/shared/src/constants/authConstants.ts`. **Always import
those — never hardcode the strings.**

## Future collections (not created yet)

| Collection | Owner | Notes |
|------------|-------|-------|
| `events/{eventId}` | TBD | Reading / lecture / roundtable events |
| `events/{eventId}/messages/{msgId}` | TBD | Per-event chat |
| `books/{isbn}` | TBD | Book catalog (barcode scan target) |
| `trades/{tradeId}` | TBD | Book exchange offers |

When adding a new collection: also add a `match /<collection>/{id}` block
to `firestore.rules`, and update [04-SECURITY-RULES.md](04-SECURITY-RULES.md).

## Schema rules of thumb

- IDs are Firestore doc IDs, not fields inside the doc (except `uid`,
  which is stored too for convenience in client code).
- All enums use lowercase string values.
- Timestamps are ISO strings (not Firestore `Timestamp`) — easier to log,
  same total cost.
- Don't mutate field names without a migration plan — the mobile app
  already reads them.
