# Web Feature Port Plan

Port of mobile-team features from `origin/main` to the web app, on branch
`phase2/web-mobile-unification-anaom`. Features selected: chat (1), map-based
offer flow (3), reviews & ratings (4), follow system (6 — replaces friends),
favorites page (7), explore refinements (8), updated Cloud Functions (9).

**Written to be executed phase-by-phase in separate sessions. Each phase is
independently committable and verifiable. Do not start a phase until the
previous one is committed and the build passes.**

---

## Global rules (read before every phase)

1. **Never push to `main`.** Only commit/push to `phase2/web-mobile-unification-anaom`.
2. **Never run `firebase deploy` without explicitly asking the user first.**
   Steps that need a deploy are marked `⚠️ DEPLOY — ASK USER`.
3. **Never create `.web.js` service files.** This branch uses single shared
   service files in `packages/shared/src/services/`. The bare import
   `./firebase` resolves to `firebase.web.js` on web automatically (Vite
   `resolve.extensions`) and to `firebase.js` on mobile (Metro). When copying
   code from `origin/main`, rewrite these imports:
   - `@readme/shared/src/services/firebase` → `./firebase` (inside shared services)
   - `./firebase.web` → `./firebase`
   - any `something.web` service import → `something`
4. **Reference code lives on `origin/main`, not in the working tree.** To read
   a file from main: `git show origin/main:<path>`. Copy function bodies
   verbatim where possible — this minimizes conflicts in the future merge
   with main.
5. **Do not modify `apps/mobile/` in any phase.** Web + `packages/shared` +
   `functions/` + `firestore.rules` only. When adding to a shared file, only
   append/extend — never rename or remove existing exports (mobile uses them).
6. **Verification ritual (run at the end of every phase):**
   ```
   cd apps/web && npx vite build        # must pass, then delete dist/
   ```
   Then start/reload the preview server (`.claude/launch.json`, name `web`,
   port 5200) and confirm zero console errors. Screenshot pages you changed.
7. Existing conventions to follow: CSS modules per component using tokens from
   `apps/web/src/styles/themeVars.css` (never hardcoded hex); shared constants
   in `packages/shared/src/constants/`; page routes in
   `apps/web/src/constants/webRoutes.js` + `apps/web/src/routes/AppRouter.jsx`;
   reusable web components in `apps/web/src/components/` (`UserAvatar`,
   `UserListPage`, `BookCover`, `Toggle`, `Spinner`, `Button`, `ErrorAlert`,
   `useToast` hook).
8. Commit messages: conventional style (`feat(web): …`), no Claude attribution.

---

## Phase 0 — Shared foundation (models, constants, services, rules, functions)

Everything later phases depend on. No UI in this phase.

### 0.1 Copy new models from main (verbatim)

```
git show origin/main:packages/shared/src/models/chat.js    > packages/shared/src/models/chat.js
git show origin/main:packages/shared/src/models/message.js > packages/shared/src/models/message.js
git show origin/main:packages/shared/src/models/offer.js   > packages/shared/src/models/offer.js
git show origin/main:packages/shared/src/models/review.js  > packages/shared/src/models/review.js
git show origin/main:packages/shared/src/models/follow.js  > packages/shared/src/models/follow.js
```
These have no imports — safe to copy as-is. (Note: on Windows use
`git show ... | Set-Content -Encoding utf8 <path>` or the Write tool.)

### 0.2 Copy status constants

```
git show origin/main:packages/shared/src/constants/status.ts > packages/shared/src/constants/status.ts
```
Contains `PUBLICATION_STATUS` and `NEGOTIATION_STATUS` (accepted/pending/declined).

### 0.3 Create `packages/shared/src/services/chat.js`

Start from `git show origin/main:packages/shared/src/services/chat.js`.
Required edits:
- `import { db } from '@readme/shared/src/services/firebase'` → `import { db } from './firebase'`
- `import { NEGOTIATION_STATUS } from '@readme/shared/src/constants/status'` → `from '../constants/status'`
- Model imports are already relative (`../models/chat` etc.) — keep.

Exports an object `ChatService` with: `streamMessages(chatId, onUpdate, onError)`
(returns unsubscribe), `sendTextMessage(chatId, uid, text)`,
`updateOfferStatus(chatId, messageId, newStatus, proposerId?, receiverId?)`,
`sendInitialOffer(currentUserId, sellerId, targetBook, offeredBooks, location)`
(returns chatId), `sendCounterOffer(...)`.

Also add one function main lacks but the web chat list needs (main's mobile
Explore screen queries inline; we want it in the service):
```js
// Streams all chats where the user participates, newest first.
streamUserChats: (uid, onUpdate, onError) => {
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', uid));
    return onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        onUpdate(list);
    }, onError);
},
```

### 0.4 Create `packages/shared/src/services/reviews.js`

Start from `git show origin/main:packages/shared/src/services/reviews.js`.
Required edits:
- `import { db } from '@readme/shared/src/services/firebase'` → `'./firebase'`
- It imports `fetchUserProfile` from `'./users'` — that function is added in 0.5.

Also append a write helper (main writes reviews inline in the screen; we want
it in the service):
```js
import { addDoc } from 'firebase/firestore';       // add to existing import
import { createReviewModel } from '../models/review';

// Guard against duplicate reviews for the same swap by the same reviewer.
export const submitReview = async (swapId, chatId, reviewerId, revieweeId, rating, comment = '') => {
    const dupQ = query(collection(db, 'reviews'),
        where('swapId', '==', swapId), where('reviewerId', '==', reviewerId));
    const dup = await getDocs(dupQ);
    if (!dup.empty) throw new Error('You have already reviewed this swap.');
    await addDoc(collection(db, 'reviews'),
        createReviewModel(swapId, chatId, reviewerId, revieweeId, rating, comment));
};
```

### 0.5 Extend `packages/shared/src/services/users.js` (follow support)

Read main's version: `git show origin/main:packages/shared/src/services/users.js`.
Port these into OUR existing `users.js` (append; do not remove `getUserById`
or `getUsersByIds`):

- `fetchUserProfile(userId)` — copy verbatim, including its follow-status
  check and `followers`/`following` counts. Fix its imports: it needs
  `auth` — add `import { auth } from './firebase';` and whatever firestore
  functions it uses (`writeBatch`, `increment` are used by toggleFollowUser).
- `toggleFollowUser(targetUserId, shouldFollow)` — copy verbatim (uses
  `auth.currentUser.uid`, `writeBatch`, `increment`, `getFollowId`,
  `createFollow` from `../models/follow`).

Then add two list helpers (needed for Phase 2 following/followers pages —
model them on the existing `doGetFriends` in `friendUser.js`, which resolves
each uid against `users` and returns `{ id, username, fullName, avatarUrl }`
objects, compatible with the `UserListPage` component):

```js
export const getFollowing = async (uid) => { /* query follows where followerUid == uid, resolve followingUid profiles */ };
export const getFollowers = async (uid) => { /* query follows where followingUid == uid, resolve followerUid profiles */ };
```

### 0.6 Firestore rules

Our `firestore.rules` lacks `follows`, `chats`, `reviews`. Copy those three
blocks exactly from `git show origin/main:firestore.rules` (lines ~138–180)
into ours, before the final closing braces. Keep our existing `blocks` block
(with the `resource == null ||` guard) and keep the `friends` block for now —
it is removed in Phase 1 after the friends feature is deleted.

`⚠️ DEPLOY — ASK USER`: after editing, ask the user to approve
`firebase deploy --only firestore:rules`. **Before deploying, diff against
main's rules and confirm you are not removing anything main has** — deploy
replaces the whole ruleset. If main's live rules have blocks ours lacks
(publications etc. are already in both), merge them in first.

### 0.7 Cloud Functions upgrade (feature 9)

Replace `functions/index.js` with main's version:
`git show origin/main:functions/index.js` — it adds proper
`firebase-admin` initialization and the `updateUserRating` function
(transactional running-average of `rating`/`reviewCount` on the user doc,
triggered by `reviews/{reviewId}` creation). Copy verbatim.
Check `functions/package.json` — main's version needs `firebase-admin`
(already a dependency; verify with `git show origin/main:functions/package.json`).

`⚠️ DEPLOY — ASK USER`: `firebase deploy --only functions` when the user says so.
Note for the user: the Algolia ADMIN key is still hardcoded in this file
(pre-existing issue, also on main) — flag it, don't fix it unilaterally.

### 0.8 Verify & commit

`npx vite build` must pass (nothing imports the new files yet, so this just
catches syntax errors — also run `node --check` on each new/edited `.js` shared
file). Commit: `feat(shared): port chat/review/follow models+services, rules, functions from main`.

---

## Phase 1 — Follow system replaces friends (feature 6)

### 1.1 PublicProfile: friend button → follow button

File: `apps/web/src/pages/Users/PublicProfile.jsx`.
- Remove imports of `doAddFriend, doRemoveFriend, doIsFriend` (`friendUser`).
- Add `import { fetchUserProfile, toggleFollowUser } from '@readme/shared/src/services/users';`
- Replace `getUserById(uid)` call with `fetchUserProfile(uid)` — it returns the
  profile plus `isCurrentUserFollowing`, `followers`, `following`.
- State: replace `isFriend` with `isFollowing` (init from
  `user.isCurrentUserFollowing`).
- `handleFriendToggle` → `handleFollowToggle`: call
  `toggleFollowUser(uid, !isFollowing)`, flip state, adjust the local
  follower count optimistically, toast "Followed @x" / "Unfollowed @x".
- Button: `UserPlus`/`UserCheck` icons stay; label "Follow" / "Following".
- Stats row: add `<strong>{followersCount}</strong> followers` and
  `<strong>{user.following}</strong> following` alongside the books/trade counts.
- Block flow: `handleBlock` currently removes friendship first — replace that
  with `toggleFollowUser(uid, false).catch(() => {})` if currently following.

### 1.2 Profile pages: Friends → Following / Followers

- Rewrite `apps/web/src/pages/Profile/Friends.jsx` → delete it and create
  `apps/web/src/pages/Profile/Following.jsx` and `Followers.jsx`, both thin
  wrappers over the existing `UserListPage` component (copy the pattern from
  `BlockedUsers.jsx`):
  - Following: `loadUsers={getFollowing}`, action "Unfollow" →
    `(myUid, targetUid) => toggleFollowUser(targetUid, false)` — check
    `UserListPage`'s `onAction` signature in the component before wiring.
  - Followers: `loadUsers={getFollowers}`, no action button (pass no
    `onAction` if the component supports it; if not, extend `UserListPage` to
    make the action optional).
- `apps/web/src/constants/webRoutes.js`: replace `PROFILE_FRIENDS` with
  `PROFILE_FOLLOWING: '/profile/following'` and
  `PROFILE_FOLLOWERS: '/profile/followers'`.
- `apps/web/src/routes/AppRouter.jsx`: swap the Friends route for the two new ones.
- `apps/web/src/pages/Profile/index.jsx`: the menu item that pointed at
  Friends (icon `Users`) becomes "Following"; optionally add "Followers".

### 1.3 Delete the friends feature

- Delete `packages/shared/src/services/friendUser.js`,
  `packages/shared/src/models/friend.js`. Keep
  `packages/shared/src/models/relationship.js` only if `block.js` still uses
  it (check `packages/shared/src/models/block.js` — on our branch it does).
- `grep -rn "friendUser\|getFriendId\|doIsFriend\|doAddFriend" apps/web/src packages/shared/src`
  must come back empty afterwards.
- Remove the `friends` block from `firestore.rules`.
  `⚠️ DEPLOY — ASK USER` (rules again).

### 1.4 Verify & commit

Build + preview. Manually test in the browser if the user provides
credentials; otherwise verify no console errors on load and screenshot the
profile page. Commit: `feat(web): follow system replaces friends`.

---

## Phase 2 — Explore refinements (feature 8)

File: `apps/web/src/pages/Map/index.jsx` (the Explore page).

### 2.1 Hide blocked users' books

In `loadTrades`, also fetch `doGetBlockedUids(uid)` (from
`@readme/shared/src/services/blockUser`, returns a `Set`) in the same
`Promise.all`, and filter: `available.filter(item => !blockedUids.has(item.ownerId))`.

### 2.2 Hide books already in an accepted trade

Add to `packages/shared/src/services/trades.js`:
```js
// Set of bookIds that are locked by an accepted (in-progress) trade.
export async function getAcceptedTradeBookIds() {
    const q = query(collection(db, 'trades'), where('status', '==', TRADE_STATUS.ACCEPTED));
    const snap = await getDocs(q);
    return new Set(snap.docs.map(d => d.data().bookId));
}
```
(Import `TRADE_STATUS` from `../constants/trade` — check what `trades.js`
already imports.) In `loadTrades`, fetch this too and filter out matching
`item.bookId`. Note: the trades `read` rule limits reads to participants —
if the query errors for non-participants, `catch` and fall back to an empty
Set, and flag the rules limitation to the user in the final report.

### 2.3 Verify & commit

Build + preview Explore tab renders. Commit:
`feat(web): explore hides blocked users and accepted-trade books`.

---

## Phase 3 — Favorites page (feature 7)

Web already stores favorites in `users/{uid}/favoriteBooks` via
`favoriteBooksService` (hearts on the Books page). This page just displays them.
(Mobile's favorites are publication-based — different data model; do NOT copy
the mobile screen. Note this divergence in the final report.)

### 3.1 Page

Create `apps/web/src/pages/Profile/Favorites.jsx` + `Favorites.module.css`:
- Load: `favoriteBooksService.getBooksData(uid)` → ids →
  `hydrateMyBooks(rawDocs, { apiKey: import.meta.env.VITE_GOOGLE_BOOKS_API_KEY })`
  (see `apps/web/src/pages/Books/index.jsx` for the exact pattern).
- Render a grid of covers using the `BookCover` component + title/authors
  (`formatAuthors`), each linking to `WEB_ROUTES.bookDetail(book.id)`.
- Un-favorite button (Heart icon) on each card →
  `favoriteBooksService.removeBook(uid, bookId)` + optimistic removal.
- Header pattern (back button + title) — copy from `BlockedUsers`/`Friends`
  page style.

### 3.2 Wiring

- `webRoutes.js`: `PROFILE_FAVORITES: '/profile/favorites'`.
- `AppRouter.jsx`: route inside the AppShell group.
- `Profile/index.jsx`: the existing "Favorites" menu row (Heart icon — check
  if present; if it's a dead row, point it at the new route).

### 3.3 Verify & commit

Build + preview. Commit: `feat(web): favorites page`.

---

## Phase 4 — Chat (feature 1)

Replace the placeholder `apps/web/src/pages/Chat/index.jsx` with a two-pane
messenger (list left, conversation right; on <720px show one pane at a time).

### 4.1 Chat list (left pane)

- `ChatService.streamUserChats(uid, setChats)` (added in 0.3), unsubscribe on
  unmount.
- Each row: other participant's name + avatar (resolve via `getUsersByIds` on
  the participant uids that aren't mine — batch once per snapshot),
  `chat.targetBookImage` thumbnail if present, `lastMessage` preview,
  relative time of `updatedAt`.
- Clicking selects the chat (state `activeChatId`; also support
  `/chat?c=<chatId>` via `useSearchParams` so other pages can deep-link).

### 4.2 Conversation (right pane)

- `ChatService.streamMessages(chatId, setMessages)` — messages arrive
  **desc**; render newest at the bottom (reverse or column-reverse).
- Text composer at the bottom → `ChatService.sendTextMessage`.
- Message bubbles: mine right (var(--primary) bg, var(--primary-text) text),
  theirs left (var(--bg-elem)). Timestamps `toLocaleTimeString`.
- **Offer messages** (`msg.type === 'offer'`): render a card instead of a
  bubble: target book image, "Offered: N book(s)", location title/address,
  status pill (pending/accepted/declined/countered — colors: pending
  var(--secondary), accepted var(--success), declined var(--error)).
  - If I'm the receiver and status is pending: Accept / Decline buttons →
    `ChatService.updateOfferStatus(chatId, msg.id, NEGOTIATION_STATUS.ACCEPTED, msg.senderId, myUid)`
    (or DECLINED). Import `NEGOTIATION_STATUS` from
    `@readme/shared/src/constants/status`.
  - Accepted offers show the verification section (Phase 6).

### 4.3 Verify & commit

Build + preview (chat page loads empty-state without errors when logged out /
no chats). Commit: `feat(web): real-time chat with offer messages`.

---

## Phase 5 — Map-based offer flow (feature 3)

Entry point: the Explore page `TradeCard` and/or `PublicProfile` book rows —
add an "Offer swap" button that opens the flow. Implement as a single page
`apps/web/src/pages/Offers/NewOffer.jsx` with two steps in local state
(step 1: pick books; step 2: pick location), route
`/offers/new?book=<bookId>&owner=<uid>`.

### 5.1 Dependencies

`npm install --workspace=apps/web leaflet react-leaflet` and import
`leaflet/dist/leaflet.css` in the page. Use OpenStreetMap tiles
(`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`, attribution required)
— no API key needed. Note: react-leaflet requires the map container to have
an explicit height in CSS.

### 5.2 Step 1 — choose offered books

- Load my books (`myBooksService.getBooksData(uid)` + hydrate) and render a
  selectable grid (multi-select, reuse `BookCover`).
- Show the target book (from `?book=` param via `getBook`) at the top as
  "You are requesting".

### 5.3 Step 2 — choose meeting location

- Leaflet map, default center: browser geolocation
  (`navigator.geolocation.getCurrentPosition`, fall back to Lisbon
  38.7223, -9.1393).
- Click on map drops/moves a pin. Reverse-geocode the pin via Nominatim
  (`https://nominatim.openstreetmap.org/reverse?format=json&lat=..&lon=..`,
  include a `User-Agent`-friendly usage — it's fine at this scale) to fill
  `{ title: display_name.split(',')[0], address: display_name }`.
- Optional search box: Nominatim `search?format=json&q=...` with a 350ms
  debounce, results as a dropdown; picking one moves the pin.
- Location object shape must match `createOfferModel`'s `location`:
  `{ id: null, title, address }` (plus keep `lat`/`lon` — extra fields are fine).

### 5.4 Submit

`ChatService.sendInitialOffer(myUid, ownerUid, targetBook, selectedBooks, location)`
— `targetBook` needs `{ id, title, coverUrl }` (the service reads
`targetBook.id`, `targetBook.title`, and image fallbacks — pass
`imageUrl: coverUrl` too). Returns `chatId` → `navigate('/chat?c=' + chatId)`.

Counter-offers (`ChatService.sendCounterOffer`) can be wired from the offer
card in chat as a follow-up; treat as optional if time is short — the accept/
decline path is the core.

### 5.5 Verify & commit

Build + preview both steps render; map tiles load. Commit:
`feat(web): two-step swap offer flow with map location picker`.

---

## Phase 6 — Swap completion + reviews (feature 4)

Web substitute for the mobile QR handoff (QR feature was NOT selected): the
accepted offer already carries `verificationCode`, `verificationDisplayerId`,
`verificationScannerId` (set by `updateOfferStatus` on accept).

### 6.1 Verification UI on the accepted-offer card (in chat)

- If `myUid === offerDetails.verificationDisplayerId`: show the code
  prominently ("Show this code at the swap").
- If `myUid === offerDetails.verificationScannerId`: show a text input
  ("Enter the code from the other person") + Confirm button. On match with
  `offerDetails.verificationCode` (case-insensitive), update the message doc:
  `{ 'offerDetails.status': 'completed', 'offerDetails.verifiedAt': new Date().toISOString() }`
  (add a `ChatService.completeSwap(chatId, messageId)` helper for this).
  On mismatch show inline error.

### 6.2 Review prompt

When an offer card has `status === 'completed'` and the current user hasn't
reviewed it yet: show "Rate this swap" on the card → inline star picker
(reuse the `StarRating` pattern from `BookDetail.jsx`) + comment textarea →
`submitReview(msg.id, chatId, myUid, otherUid, rating, comment)` (from 0.4).
The Cloud Function (`updateUserRating`, deployed in Phase 0) updates the
reviewee's `rating`/`reviewCount` automatically — do not write those fields
from the client.

### 6.3 Reviews on the public profile

`apps/web/src/pages/Users/PublicProfile.jsx`:
- Show `★ {user.rating} ({user.reviewCount})` next to the name when
  `reviewCount > 0` (fields come from `fetchUserProfile`).
- Add a "Reviews" section listing `fetchUserReviews(uid)` (from
  `reviews.js`): author name, stars, comment, date. Cap at ~10, newest first.

### 6.4 Verify & commit

Build + preview. Commit: `feat(web): swap completion via code + post-swap reviews`.

---

## Final phase — report

Summarize for the user: what was built, what was intentionally skipped
(counter-offer UI if skipped, QR scanning replaced by code entry, mobile's
publication-based favorites vs web's book-based), pending deploys
(rules/functions if the user hasn't approved yet), and the standing issues to
raise with the team: Algolia admin key hardcoded in `functions/index.js`, and
the `trades` read rule possibly blocking `getAcceptedTradeBookIds` for
non-participants.
