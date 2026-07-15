# Trade module — geolocation additions

> **Status: superseded**, along with `docs/12-TRADE-MODULE-PLAN.md` which this
> depends on — the open-shelves `myBooks` browse model it's built on was never
> shipped. What exists instead: each offer carries a single meeting-point
> location (`offerDetails.location: { id, title, address, latitude, longitude }`,
> picked on the map when making the offer), not a proximity search over other
> users' shelves. No geohashing or per-user location opt-in exists. Kept for
> historical context only.

## Why this is needed

The current Browse tab loads **all** `myBooks` entries across all users via a
collection-group query. That works at small scale, but for a community where books
are only practical to exchange in person, it returns books from the other side of the
country just as readily as books a street away. Geolocation-based filtering makes the
feature genuinely useful: show me books within _N_ km of where I am.

Firestore does not support native radius queries. The standard solution is
**geohashes** — encoding a lat/lng into a short string prefix that can be range-queried.
The `geofire-common` package (framework-agnostic, works on both mobile and web) provides
the encoding and range-query helpers.

---

## Schema changes required

### 1. Add location to `users/{uid}`

Users must opt in to sharing their approximate location before their books appear in
proximity searches. Add these fields to the user document (written at profile-save time,
or via a dedicated "Update location" action):

| Field | Type | Notes |
|-------|------|-------|
| `location.lat` | number | WGS84 latitude |
| `location.lng` | number | WGS84 longitude |
| `location.geohash` | string | 9-char geohash via `geofire-common` |
| `location.city` | string | Human-readable label shown to other users |
| `location.updatedAt` | string | ISO timestamp of last location update |
| `locationSharingEnabled` | boolean | `false` by default — explicit opt-in |

**Do NOT store `lat`/`lng` on every `myBooks` entry** — that duplicates data and makes
it hard to update when the user moves. Store it once on the user, join at query time.

Update `docs/03-FIRESTORE-MODEL.md` when implementing.

### 2. No change to `trades/{tradeId}` or `myBooks/{bookId}`

The trade document and myBooks entries don't need location — the proximity filter is
applied to the owning user, not to individual books.

---

## Security rules changes

In `firestore.rules`, update `users/{userId}` to allow reading the location fields
for active users doing proximity search, while keeping sensitive profile fields private.
Two approaches:

**Option A (simpler):** Accept that the whole user doc is readable by active members
(already true — current rule allows `isAuthenticated() && isActive()` to read any
user doc). No rule change needed; location fields just become part of the readable doc.

**Option B (stricter):** Split user fields into a public sub-document
`users/{uid}/public/{docId}` containing only `{ username, location, geohash, city }`.
The main user doc stays owner-only for sensitive fields. More work, cleaner privacy.

**Recommendation:** Start with Option A (it matches the current "open shelves" decision),
revisit if privacy requirements tighten.

---

## Query approach

`geofire-common` turns a centre point + radius into **multiple Firestore range queries**
(one per geohash "cell" that overlaps the circle). The steps:

```js
import { geohashQueryBounds, distanceBetween } from 'geofire-common';

// 1. Get bounds for the search radius (e.g. 25 km)
const bounds = geohashQueryBounds([centerLat, centerLng], radiusKm * 1000);

// 2. Run a query per bound against the users collection
const promises = bounds.map(([start, end]) =>
    getDocs(query(
        collection(db, 'users'),
        where('locationSharingEnabled', '==', true),
        where('location.geohash', '>=', start),
        where('location.geohash', '<=', end),
    ))
);
const snapshots = await Promise.all(promises);

// 3. Client-side filter: geohash cells are square, not round
const nearbyUids = [];
for (const snap of snapshots) {
    for (const userDoc of snap.docs) {
        const d = distanceBetween(
            [userDoc.data().location.lat, userDoc.data().location.lng],
            [centerLat, centerLng],
        );
        if (d <= radiusKm) nearbyUids.push(userDoc.id);
    }
}

// 4. Collection-group query scoped to those UIDs
// (same getAvailableTradeBooks logic, but filter by ownerId ∈ nearbyUids)
```

Put this in a new `getAvailableTradeBooksNear(excludeUid, centerLat, centerLng, radiusKm)`
function in `packages/shared/src/services/trades.web.js` (and the `.js` mobile variant).

**Index required:** Firestore will prompt for a composite index on
`users` — `(locationSharingEnabled ASC, location.geohash ASC)`. Follow the console link
or add it to `firestore.indexes.json` before shipping.

---

## Web UI changes

**Profile page (`apps/web/src/pages/Profile/index.jsx`)**
- Add a "Share my location for book trading" toggle (off by default).
- On enable: call `navigator.geolocation.getCurrentPosition`, encode geohash via
  `geofire-common`, write to Firestore.
- Show the saved `city` label so the user knows what's stored.
- On disable: set `locationSharingEnabled: false` (do not delete coords — easier to
  re-enable without a fresh geolocation prompt).

**Trades browse tab (`apps/web/src/pages/Trades/index.jsx`)**
- Add a radius slider (e.g. 5 / 25 / 50 / 100 km) above the book list.
- If the current user has `locationSharingEnabled: true`: use
  `getAvailableTradeBooksNear`. Otherwise, fall back to the existing
  `getAvailableTradeBooks` (global) with a banner prompting them to enable location.
- Show owner's `city` on each `AvailableBookCard` instead of just `username`, so
  the distance context is visible before making a request.

---

## Mobile (Expo) notes

- Use `expo-location` (`Location.getCurrentPositionAsync`) — already in the Expo SDK;
  no extra install needed.
- Same `geofire-common` package works on React Native.
- Ask for `Location.requestForegroundPermissionsAsync` before reading position.
- The mobile trade screen (when built) should mirror the radius filter from the web.

---

## Packages to install

```bash
# root (shared by both apps)
npm install geofire-common --workspace=packages/shared
```

No other new dependencies needed. `navigator.geolocation` is native in browsers;
`expo-location` is already available.

---

## Implementation order

1. Install `geofire-common`.
2. Add location fields to Profile page (web) — write lat/lng/geohash/city/flag on save.
3. Write `getAvailableTradeBooksNear` in `trades.web.js`.
4. Deploy Firestore index.
5. Update Browse tab with radius slider + fallback.
6. Repeat for mobile when the mobile trade screen is built.
