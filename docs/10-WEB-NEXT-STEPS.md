# What to build next on the web app

The skeleton is in place. Every section has a route, a sidebar link, and an
auth guard. Now each section needs real content. This is a checklist for
whoever picks up next, in roughly the order they should be tackled.

## Before any of this

A few things need team agreement first, since they affect the whole project,
not just web:

- **Firestore schemas for `/books`, `/events`, `/trades`, and per-event
  `/chat` subcollections.** None of these exist yet. Web can't write to
  them safely until the shape is agreed and matches what mobile expects.
- **Security rules for those collections.** `firestore.rules` currently only
  covers `/users/{userId}`. Until rules are added, writes will be rejected.
- **Email sender reputation.** Verification and password-reset emails land
  in Spam (new sending domain). Either accept that for v1, or set up SPF
  + DKIM in Firebase Console.

Raise these at the next team meeting before building section content.

### Suggested schemas

A concrete starting point for the team to react to. These follow the same
conventions as `users/{uid}` (see
[03-FIRESTORE-MODEL.md](03-FIRESTORE-MODEL.md)): doc id is the Firestore key,
enums are lowercase strings, dates are ISO strings, and anything a user
creates carries an `ownerId` so the security rules can check ownership.

**`books/{bookId}`** — the catalog. One doc per distinct book (key on ISBN
when there is one, so scans dedupe naturally).

| Field | Type | Notes |
|-------|------|-------|
| `isbn` | string | also the doc id when available |
| `title` | string | |
| `authors` | array | |
| `coverUrl` | string | nullable |
| `addedBy` | string | uid of whoever first added it |
| `createdAt` | string | ISO |

Per-user data (owned, read, rating) does **not** go here — it goes on a
copy under the user (e.g. `users/{uid}/library/{bookId}`) so two people
rating the same book don't collide.

**`events/{eventId}`** — reading / lecture / roundtable events.

| Field | Type | Notes |
|-------|------|-------|
| `ownerId` | string | uid of the organizer |
| `title` | string | |
| `description` | string | |
| `type` | enum | `'reading'` \| `'lecture'` \| `'roundtable'` |
| `startsAt` | string | ISO |
| `location` | object | `{ label, lat, lng }` — embedded, always read with the event |
| `attendeeCount` | number | denormalized count for list views |
| `createdAt` | string | ISO |

Who's attending is a list that grows, so keep it out of the doc — use
`events/{eventId}/attendees/{uid}` instead of an array.

**`events/{eventId}/messages/{msgId}`** — per-event chat (subcollection, not
an array, because messages grow unbounded and are read on their own).

| Field | Type | Notes |
|-------|------|-------|
| `senderId` | string | uid |
| `senderName` | string | denormalized so chat renders without a user lookup |
| `text` | string | |
| `createdAt` | string | ISO — also the sort key |

**`trades/{tradeId}`** — a book-exchange offer between two users.

| Field | Type | Notes |
|-------|------|-------|
| `bookId` | string | reference into `books/` |
| `offeredBy` | string | uid making the offer |
| `requestedFrom` | string | uid who owns the book |
| `status` | enum | `'pending'` \| `'accepted'` \| `'declined'` \| `'completed'` |
| `createdAt` | string | ISO |
| `updatedAt` | string | ISO |

Two rules of thumb the team should keep applying:

- **Embed vs. subcollection:** embed small data always read with the parent
  (an event's `location`); use a subcollection for lists that grow
  unbounded or are read separately (chat messages, attendees).
- **Write the security rule with the schema, not after.** Fields that must
  never change after creation (`ownerId`, `createdAt`) should be locked down
  in `firestore.rules` at the same time.

Keep the first version minimal — it's cheaper to add a field later than to
migrate documents already in production. Once agreed, record the final shape
in [03-FIRESTORE-MODEL.md](03-FIRESTORE-MODEL.md) so mobile and web build
against the same thing.

## Section-by-section

### Profile (`pages/Profile/`)
**Smallest jump from current state — start here.** The Firestore schema
already exists (`users/{uid}` — see
[03-FIRESTORE-MODEL.md](03-FIRESTORE-MODEL.md)) and the security rules
already allow the owner to update it.

- Show the current user's name, email, address, phone — read from
  `users/{uid}` via `getDoc`
- "Edit" mode with the same `Field` component used in Register
- Save with `updateDoc` (don't touch `role` or `accountStatus` — rules
  block it anyway)
- Show profile visibility toggle (public ⇄ private)

### My Books (`pages/Books/`)
- List the current user's books once the `/books` collection exists
- "Add a book" form (manual entry on web; barcode scanning stays
  mobile-only — `Books/Scan.jsx` already says so)
- Public catalog view (anyone authenticated can browse others' books)

### Events + Map (`pages/Map/`, `pages/Events/Details.jsx`)
- List of upcoming events (filterable by topic / date / distance — req 2.3
  in the brief)
- Map view using a web map library (Leaflet is the easiest pick — no
  Google Maps API key needed)
- Event details page already takes `:eventId` — just needs to read the
  event doc
- Join / leave event actions

### Community / Chat (`pages/Chat/`)
- List of events the user has joined
- Per-event chat using a Firestore subcollection
  (`events/{eventId}/messages`) with a real-time `onSnapshot` listener
- Should mirror what mobile does so the same chat works on both

## Auth & UX polish

These don't depend on team decisions and can happen in parallel:

- **Email verification flow.** Today, signing in before verifying silently
  bounces back to `/login` with no error. Add a "Please verify your email"
  screen that polls `auth.currentUser.reload()` so the user lands somewhere
  after clicking the email link.
- **Google sign-in popup.** The fix landed but was never confirmed in a
  normal browser session. Click "Continue with Google" yourself once, then
  check that a `users/{uid}` doc gets created with `authProvider: "google"`.
- **Loading and error states.** Most pages don't show one yet. Settle on
  a single pattern (e.g. small spinner + `role="alert"` for errors) and
  apply it everywhere.

## Deploy

Once at least one section is functional:

- `firebase init hosting` in `apps/web/` (uses `dist/` as the public dir
  after `npm run build`)
- `firebase deploy --only hosting` — **needs team approval** per the
  hard rule on shared infrastructure

Optional after that: PWA wrapper (manifest + service worker) so the web app
can be installed to a phone's home screen.

## What's done already (don't redo)

Skip these — they're already in place. See
[09-WEB-STRUCTURE.md](09-WEB-STRUCTURE.md) for the file layout.

- Routing + auth guard
- Login / Register (3 steps) / Forgot Password / Welcome / Splash
- App shell with sidebar + sign-out
- Section page stubs (Books, Map, Events, Chat, Profile)
- Theme variables (light + dark)
- Firebase wiring with real env vars
