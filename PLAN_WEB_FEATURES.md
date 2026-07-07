# Web Feature Port Plan

Port of mobile-team features from `origin/main` to the web app, on branch
`phase2/web-mobile-unification-anaom`.

**Features (updated):** publications marketplace (replaces the old
"available for trade" mechanism), chat (1), map-based offer flow (3),
reviews & ratings (4), **follow** system replacing friends (6), favorites =
publication likes (7), explore = publications feed (8), updated Cloud
Functions (9).

**Dropped:** the "available for trade" boolean on `myBooks` and the old
`trades`-collection request system are retired (see Phase 7). QR scanning is
NOT ported — swap completion uses manual code entry instead. Web keeps the
mobile *follow* concept, not our old *friends* concept.

**Written to be executed phase-by-phase in separate (Haiku) sessions. Each
phase is independently committable and verifiable. Do not start a phase until
the previous one is committed and its build passes.**

---

## Firebase: default to NO deploys

Rules, Storage rules, and Cloud Functions are **backend config shared with the
mobile app** — web does not get its own. If a feature works on mobile's live
app, its backend is already deployed, and web using the same collections needs
nothing.

Concrete state (verified 2026-07-08):
- **Publications: nothing to do.** The `publications` Firestore rules are
  already in our branch's `firestore.rules`, and `storage.rules` already
  allows publication image uploads under `books/{publicationId}/…`. Both are
  live (mobile creates publications against them).
- **Only `follows`, `chats`, `reviews` rules are missing from our branch's
  rules file** vs main. They exist on main and are almost certainly deployed
  (mobile's chat/follow/reviews are live).
- **`updateUserRating` Cloud Function** is likewise already deployed if
  mobile's rating works.

**Rule for every phase:** do NOT run `firebase deploy`. Instead:
1. When a phase needs a rules block our file lacks, copy that block into
   `firestore.rules` from `git show origin/main:firestore.rules` — this is a
   **file edit only**, so our source stays a correct superset and a future
   merge/deploy won't regress it. It does **not** change the live backend.
2. During that phase's browser testing, watch for `permission-denied` /
   `Missing or insufficient permissions`. Only if one actually appears does a
   deploy become necessary — and at that point:
   `⚠️ DEPLOY — ASK THE USER FIRST` before running
   `firebase deploy --only firestore:rules` (or `:functions`). Before any such
   deploy, diff our file against `git show origin/main:firestore.rules` and
   make sure we are a superset — deploy replaces the entire ruleset.

If no permission errors surface, this whole port ships with zero Firebase
deploys.

---

## Global rules (read before every phase)

1. **Never push to `main`.** Only commit/push to `phase2/web-mobile-unification-anaom`.
2. **Never `firebase deploy`** unless a real permission error forces it AND the
   user has approved (see Firebase section).
3. **Never create `.web.js` service files.** Single shared files in
   `packages/shared/src/services/`. Bare `./firebase` resolves to
   `firebase.web.js` on web (Vite `resolve.extensions`) and `firebase.js` on
   mobile (Metro). When copying code from `origin/main`, rewrite imports:
   - `@readme/shared/src/services/firebase` → `./firebase` (inside a shared service)
   - `./firebase.web` → `./firebase`; any `something.web` service import → `something`
4. **Reference code lives on `origin/main`, not the working tree.** Read it via
   `git show origin/main:<path>`. Copy function bodies verbatim where possible
   to minimize the eventual main-merge conflicts.
5. **Do not modify `apps/mobile/`.** Web + `packages/shared` + `functions/` +
   rules files only. When touching a shared file, **append/extend only** —
   never rename or remove existing exports (mobile imports them).
6. **Verification ritual (end of every phase):**
   `cd apps/web && npx vite build` must pass, then delete `dist/`. Also
   `node --check` each new/edited shared `.js` file. Then start/reload the
   preview (`.claude/launch.json`, name `web`, port 5200) and confirm zero
   console errors; screenshot changed pages.
7. Conventions: CSS modules per component using tokens from
   `apps/web/src/styles/themeVars.css` (never hardcoded hex); shared constants
   in `packages/shared/src/constants/`; routes in
   `apps/web/src/constants/webRoutes.js` + `apps/web/src/routes/AppRouter.jsx`;
   reuse `apps/web/src/components/` (`UserAvatar`, `UserListPage`, `BookCover`,
   `Toggle`, `Spinner`, `Button`, `ErrorAlert`) and the `useToast` hook.
8. Commit messages: conventional (`feat(web): …`), no Claude attribution.

---

## Phase 0 — Shared foundation

No UI. Everything later phases import.

### 0.1 Copy new models from main (verbatim — no imports to fix except noted)
```
packages/shared/src/models/publication.js   (imports ../constants/status — fine)
packages/shared/src/models/chat.js
packages/shared/src/models/message.js
packages/shared/src/models/offer.js
packages/shared/src/models/review.js
packages/shared/src/models/follow.js
```
Read each with `git show origin/main:<path>` and write it to the same path.

### 0.2 Copy status constants
`git show origin/main:packages/shared/src/constants/status.ts` →
`packages/shared/src/constants/status.ts`
(`PUBLICATION_STATUS` = available/reserved/swapped; `NEGOTIATION_STATUS` =
accepted/pending/declined).

### 0.3 Publications service
Copy `git show origin/main:packages/shared/src/services/publications.js` →
same path. Fix `./firebase` import. It has `fetchUserPublications(userId)`.
**Append** these functions the web feed/detail/create pages need:
```js
import { doc, getDoc, setDoc, deleteDoc, addDoc } from 'firebase/firestore'; // extend existing import

// All publications, newest first (Explore feed). Simple client sort — fine at project scale.
export const fetchAllPublications = async () => {
    const snap = await getDocs(collection(db, 'publications'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const fetchPublicationById = async (id) => {
    const s = await getDoc(doc(db, 'publications', id));
    return s.exists() ? { id: s.id, ...s.data() } : null;
};

// customId lets the caller reuse the same id for the Storage folder books/{id}.
export const createPublication = async (customId, data) => {
    await setDoc(doc(db, 'publications', customId), data);
    return customId;
};

export const deletePublication = async (id) => deleteDoc(doc(db, 'publications', id));
```

### 0.4 Chat service
Copy `git show origin/main:packages/shared/src/services/chat.js` →
`packages/shared/src/services/chat.js`. Fix imports (`./firebase`,
`../constants/status`). Exports `ChatService` object:
`streamMessages`, `sendTextMessage`, `updateOfferStatus`, `sendInitialOffer`
(returns chatId), `sendCounterOffer`. **Append** a chat-list stream:
```js
streamUserChats: (uid, onUpdate, onError) => {
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', uid));
    return onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        onUpdate(list);
    }, onError);
},
```
And a completion helper for Phase 6:
```js
completeSwap: async (chatId, messageId) => {
    await updateDoc(doc(db, `chats/${chatId}/messages`, messageId), {
        'offerDetails.status': 'completed',
        'offerDetails.verifiedAt': new Date().toISOString(),
    });
},
```

### 0.5 Reviews service
Copy `git show origin/main:packages/shared/src/services/reviews.js` → same
path. Fix `./firebase`. It imports `fetchUserProfile` from `./users` (added in
0.6) and exports `fetchUserReviews(revieweeId)`. **Append** the write helper:
```js
import { addDoc } from 'firebase/firestore';        // extend import
import { createReviewModel } from '../models/review';

export const submitReview = async (swapId, chatId, reviewerId, revieweeId, rating, comment = '') => {
    const dup = await getDocs(query(collection(db, 'reviews'),
        where('swapId', '==', swapId), where('reviewerId', '==', reviewerId)));
    if (!dup.empty) throw new Error('You have already reviewed this swap.');
    await addDoc(collection(db, 'reviews'),
        createReviewModel(swapId, chatId, reviewerId, revieweeId, rating, comment));
};
```

### 0.6 Extend `users.js` (follow + favorites + profile)
Read `git show origin/main:packages/shared/src/services/users.js`. **Append**
to OUR existing `users.js` (keep `getUserById`, `getUsersByIds`):
- `fetchUserProfile(userId)` — verbatim; returns profile + `isCurrentUserFollowing`
  + `followers`/`following` counts. Needs `auth` (`import { auth } from './firebase'`)
  and `getFollowId` from `../models/follow`.
- `toggleFollowUser(targetUserId, shouldFollow)` — verbatim; uses
  `writeBatch`, `increment`, `createFollow`.
- `toggleFavoriteStatus(userId, pubId, isCurrentlyFavorited)` — verbatim;
  `arrayUnion`/`arrayRemove` on the user doc's `favoriteBooks` field +
  `increment` on the publication's `stats.likesCount`. **This is the mobile
  favorites model** — favorites are publication ids on the user doc, not the
  old `favoriteBooks` subcollection.
- Two list helpers (model on `doGetFriends` in `friendUser.js`, returns
  `{ id, username, fullName, avatarUrl }` for `UserListPage`):
  `getFollowing(uid)` (query `follows` where `followerUid==uid`, resolve
  `followingUid` profiles) and `getFollowers(uid)` (where `followingUid==uid`).

### 0.7 Firestore rules (file edit only — NO deploy)
Our `firestore.rules` already has `publications`. Add the `follows`, `chats`,
`reviews` blocks from `git show origin/main:firestore.rules` (verbatim), before
the final closing braces. Leave the live backend alone — see Firebase section.
The `friends` block is removed later in Phase 1.

### 0.8 Cloud Functions (file edit only — NO deploy)
Replace `functions/index.js` with `git show origin/main:functions/index.js`
(adds `firebase-admin` init + `updateUserRating`). Update
`functions/package.json` to match main if it differs. Do not deploy unless a
missing-function symptom appears in Phase 6 (then ASK USER). Flag to the user:
the Algolia admin key is hardcoded here (pre-existing, also on main).

### 0.9 Verify & commit
`npx vite build` (catches syntax; nothing imports these yet) + `node --check`
each shared file. Commit:
`feat(shared): port publications/chat/review/follow models, services, rules, functions from main`.

---

## Phase 1 — Follow system replaces friends (feature 6)

### 1.1 PublicProfile → follow
`apps/web/src/pages/Users/PublicProfile.jsx`:
- Drop `friendUser` imports. Add
  `import { fetchUserProfile, toggleFollowUser } from '@readme/shared/src/services/users';`
- Load with `fetchUserProfile(uid)` (gives `isCurrentUserFollowing`,
  `followers`, `following`).
- State `isFollowing` (init from `user.isCurrentUserFollowing`);
  `handleFollowToggle` → `toggleFollowUser(uid, !isFollowing)`, optimistic
  flip + follower-count adjust, toast "Followed @x"/"Unfollowed @x".
- Button label "Follow"/"Following" (keep `UserPlus`/`UserCheck`).
- Stats row: add `<strong>{followers}</strong> followers` and
  `<strong>{following}</strong> following`.
- In `handleBlock`, replace the "remove friend first" step with
  `if (isFollowing) toggleFollowUser(uid, false).catch(()=>{})`.

### 1.2 Following / Followers pages
- Delete `apps/web/src/pages/Profile/Friends.jsx`. Create `Following.jsx` and
  `Followers.jsx` as thin `UserListPage` wrappers (copy `BlockedUsers.jsx`
  pattern):
  - Following: `loadUsers={getFollowing}`, action "Unfollow" →
    `(myUid, targetUid) => toggleFollowUser(targetUid, false)` (check
    `UserListPage`'s `onAction` signature first).
  - Followers: `loadUsers={getFollowers}`, no action (if `UserListPage`
    requires an action, extend it to make the action optional).
- `webRoutes.js`: replace `PROFILE_FRIENDS` with `PROFILE_FOLLOWING:
  '/profile/following'` and `PROFILE_FOLLOWERS: '/profile/followers'`.
- `AppRouter.jsx`: swap the Friends route for the two new routes.
- `Profile/index.jsx`: the Friends menu row → "Following" (+ add "Followers").

### 1.3 Delete friends
- Remove `packages/shared/src/services/friendUser.js`,
  `packages/shared/src/models/friend.js`. Keep
  `packages/shared/src/models/relationship.js` if `models/block.js` still uses
  it (it does on our branch).
- `grep -rn "friendUser\|getFriendId\|doIsFriend\|doAddFriend" apps/web/src packages/shared/src`
  must be empty.
- Remove the `friends` block from `firestore.rules` (file edit; no deploy).

### 1.4 Verify & commit
Build + preview, screenshot profile. Commit: `feat(web): follow system replaces friends`.

---

## Phase 2 — Publications: create, feed, details (features 8 + the new marketplace)

This replaces the "available for trade" mechanism as the way books become
swappable. Explore's book tab becomes a publications feed.

### 2.1 Create Publication page
New `apps/web/src/pages/Publications/CreatePublication.jsx` (+ `.module.css`),
route `/publications/new`. Fields (from mobile's CreatePublicationScreen):
book title, author, **subject**, **condition**, description (`detailsText`),
and 1+ **images**.
- Image upload (web is simpler than mobile — a `<input type="file"
  accept="image/*" multiple>` yields `File` objects directly, no XHR-to-blob):
  ```js
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { storage } from '@readme/shared/src/services/firebase.web';
  const pubId = crypto.randomUUID();
  const urls = await Promise.all(files.map(async (file, i) => {
      const r = ref(storage, `books/${pubId}/image_${i}`);
      await uploadBytes(r, file);
      return getDownloadURL(r);
  }));
  ```
- Build the doc with `createPublicationModel(uid, sellerName, sellerAvatar,
  { title, author, images: urls, bookId: crypto.randomUUID(), condition,
  subject }, description)` then `createPublication(pubId, data)` (0.3).
  `sellerName`/`sellerAvatar` come from the current user's profile
  (`fetchUserProfile(uid)` or the auth/user doc).
- On success navigate to the new detail page (2.3).
- Show a loading state during upload; disable submit until title+≥1 image.

### 2.2 Explore feed = publications (feature 8)
`apps/web/src/pages/Map/index.jsx` (Explore). Replace the "Books" tab's data
source: instead of `getAvailableTradeBooks`, call `fetchAllPublications()`
(0.3) and render publication cards.
- New card `apps/web/src/pages/Map/components/PublicationCard.jsx` (replaces
  `TradeCard`): first image (`pub.book.images[0]` via `BookCover` fallback),
  `pub.book.title`, `formatAuthors(pub.book.author)`, seller name+avatar
  (links to `WEB_ROUTES.userProfile(pub.uid)`), like count
  (`pub.stats.likesCount`) + heart toggle (`toggleFavoriteStatus`), and a
  status pill (`PUBLICATION_STATUS`). Card body links to the detail page.
- **Explore refinements (feature 8):** filter the feed to exclude
  publications whose `uid` is blocked (`doGetBlockedUids(uid)`), the current
  user's own publications (optional — mobile hides own), and publications
  whose `status !== 'available'` (hides reserved/swapped). Do the block fetch
  in the same load; `.catch(() => new Set())` so a failure degrades gracefully.
- Keep the existing Users tab and the `EXPLORE_TAB` constant.
- Add a "＋ New publication" button on the Explore page → `/publications/new`.

### 2.3 Publication Details page
New `apps/web/src/pages/Publications/PublicationDetails.jsx` (+ `.module.css`),
route `/publications/:pubId`. Model on mobile's PublicationDetailsScreen:
- `fetchPublicationById(pubId)`; if null → not-found state.
- Image gallery (multiple `pub.book.images` — simple: main image + thumbnail
  strip, click to swap; lightbox optional).
- Title, author, **condition**, **subject**, description, seller row (avatar +
  name → profile link), like count + heart.
- If viewer is NOT the owner and `status === 'available'`: **"Make an offer"**
  button → the offer flow (Phase 5), passing this publication.
- If viewer IS the owner: a Delete button (`deletePublication`) + (optional)
  status control.

### 2.4 Wiring
- `webRoutes.js`: `publicationDetail: (id) => /publications/${id}`,
  `PUBLICATION_NEW: '/publications/new'`.
- `AppRouter.jsx`: both routes inside the AppShell auth group.

### 2.5 Verify & commit
Build + preview: create a publication (if creds available), see it in Explore,
open its detail page. Commit: `feat(web): publications — create, explore feed, detail page`.

---

## Phase 3 — Favorites = publication likes (feature 7)

Now that favorites are publication ids on the user doc (0.6,
`toggleFavoriteStatus`), the favorites page matches mobile exactly.

- New `apps/web/src/pages/Profile/Favorites.jsx` (+ `.module.css`), route
  `/profile/favorites`:
  - Read `favoriteBooks: []` from the current user's doc
    (`getDoc(doc(db,'users',uid))`), then `fetchPublicationById` each (or a
    batched read). Render the same `PublicationCard` grid as Explore.
  - Un-favorite (heart) → `toggleFavoriteStatus(uid, pubId, true)` + optimistic
    removal.
  - Empty state when none.
- `webRoutes.js`: `PROFILE_FAVORITES: '/profile/favorites'`.
- `AppRouter.jsx`: route in the auth group.
- `Profile/index.jsx`: point the existing Favorites (Heart) menu row here.
- The heart toggles on `PublicationCard` (Explore + here) all go through
  `toggleFavoriteStatus`; keep favorite state in sync on the page.

Verify & commit: `feat(web): favorites page (publication likes)`.

---

## Phase 4 — Chat (feature 1)

Replace the placeholder `apps/web/src/pages/Chat/index.jsx` with a two-pane
messenger (list left, conversation right; <720px shows one pane at a time).

### 4.1 Chat list (left)
`ChatService.streamUserChats(uid, setChats)` (0.4), unsubscribe on unmount.
Row: other participant name+avatar (resolve via `getUsersByIds` on the
non-me participant uids, once per snapshot), `targetBookImage` thumbnail,
`lastMessage`, relative `updatedAt`. Select → `activeChatId`; also read/write
`/chat?c=<chatId>` via `useSearchParams` for deep-linking from other pages.

### 4.2 Conversation (right)
`ChatService.streamMessages(chatId, setMessages)` (arrives **desc** — render
newest at bottom). Text composer → `sendTextMessage`. Bubbles: mine right
(`--primary`/`--primary-text`), theirs left (`--bg-elem`).
- **Offer messages** (`msg.type === 'offer'`): render an offer card, not a
  bubble — target image, "Offered: N book(s)", location title/address, status
  pill (pending `--secondary`, accepted `--success`, declined `--error`,
  countered neutral). If I'm the receiver and pending: Accept/Decline →
  `updateOfferStatus(chatId, msg.id, NEGOTIATION_STATUS.ACCEPTED, msg.senderId, myUid)`
  / `.DECLINED`. Accepted offers show the verification UI in Phase 6.

Verify & commit: `feat(web): real-time chat with offer messages`.

---

## Phase 5 — Map-based offer flow (feature 3)

Entry: the "Make an offer" button on Publication Details (2.3). One page
`apps/web/src/pages/Offers/NewOffer.jsx`, two steps in local state, route
`/offers/new?pub=<pubId>`.

### 5.1 Deps
`npm install --workspace=apps/web leaflet react-leaflet`; import
`leaflet/dist/leaflet.css`. OpenStreetMap tiles
(`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`, keep attribution) — no
key. Map container needs an explicit CSS height.

### 5.2 Step 1 — offered books
Load target publication (`fetchPublicationById(pub)`), show it as "You are
requesting". Load my books (`myBooksService.getBooksData(uid)` + `hydrateMyBooks`)
and render a multi-select grid (reuse `BookCover`).

### 5.3 Step 2 — location
Leaflet map, default center via `navigator.geolocation` (fallback Lisbon
38.7223,-9.1393). Click drops/moves a pin; reverse-geocode via Nominatim
(`nominatim.openstreetmap.org/reverse?format=json&lat=..&lon=..`) →
`{ id:null, title: name.split(',')[0], address: name, lat, lon }`. Optional
debounced search box (Nominatim `search?format=json&q=..`).

### 5.4 Submit
`ChatService.sendInitialOffer(myUid, pub.uid, targetBook, selectedBooks, location)`
where `targetBook = { id: pub.id, title: pub.book.title, imageUrl:
pub.book.images?.[0] }`. Returns `chatId` → `navigate('/chat?c='+chatId)`.
Counter-offer (`sendCounterOffer`) from the chat offer card is optional if
time-constrained; accept/decline is the core path.

Verify & commit: `feat(web): two-step swap offer flow with map location picker`.

---

## Phase 6 — Swap completion + reviews (feature 4)

Web substitute for QR: the accepted offer already carries `verificationCode`,
`verificationDisplayerId`, `verificationScannerId` (set on accept in 4.2).

### 6.1 Verification UI on the accepted offer card (chat)
- `myUid === verificationDisplayerId`: show the code big ("Show this at the swap").
- `myUid === verificationScannerId`: code input + Confirm; on
  case-insensitive match → `ChatService.completeSwap(chatId, msg.id)` (0.4);
  mismatch → inline error.

### 6.2 Review prompt
When an offer card is `status === 'completed'` and the user hasn't reviewed:
"Rate this swap" → inline `StarRating` (reuse the pattern from `BookDetail.jsx`)
+ comment → `submitReview(msg.id, chatId, myUid, otherUid, rating, comment)`
(0.5). The deployed `updateUserRating` function updates the reviewee's
`rating`/`reviewCount` — never write those from the client.

### 6.3 Reviews on public profile
`PublicProfile.jsx`: show `★ {user.rating} ({user.reviewCount})` by the name
when `reviewCount > 0`; add a Reviews section from `fetchUserReviews(uid)`
(author name, stars, comment, date; ~10 newest first).

Verify & commit: `feat(web): swap completion via code + post-swap reviews`.
(If a `permission-denied` on `reviews`/`chats` appears in testing, this is the
phase where a rules/functions deploy may be needed — ASK USER.)

---

## Phase 7 — Retire the old "available for trade" + Trades system  (⚠️ confirm with user)

Publications + the chat offer flow fully replace the old mechanism. This phase
removes now-dead UI/paths. **Because it deletes working pages, confirm with the
user before executing.**
- `apps/web/src/pages/Books/BookDetail.jsx`: remove the "Trading" toggle
  (`availableForTrade` / `handleTradeToggle`). Optionally add a
  "Create publication for this book" link to `/publications/new` prefilled.
- Retire the Trades page: `apps/web/src/pages/Trades/` (index + `AvailableBookCard`
  + `TradeRequestCard`), its route, and the nav item — OR keep it but strip the
  "Browse" tab that used `getAvailableTradeBooks`. Decide with the user.
- Shared `trades.js`: leave the service in place (mobile may still reference
  parts; do not remove exports). Just stop calling `getAvailableTradeBooks`
  from web.
- Remove `availableForTrade` filtering from `PublicProfile.jsx`'s book lists if
  present.

Verify & commit: `refactor(web): retire available-for-trade in favor of publications`.

---

## Final phase — report
Summarize what shipped, what was intentionally skipped (QR → code entry;
counter-offer UI if skipped), whether any Firebase deploy was ultimately
needed (ideally none), and standing team issues: Algolia admin key hardcoded
in `functions/index.js`; and confirm the live ruleset actually contains
`follows`/`chats`/`reviews` (if a deploy was never triggered, note that we are
relying on the mobile team's deploy).
