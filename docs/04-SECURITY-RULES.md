# Security rules

File: `firestore.rules`. Cloud-side. Cannot be bypassed by a hostile client.

## Helper functions

| Function | Meaning |
|----------|---------|
| `isAuthenticated()` | `request.auth != null` — caller signed in |
| `isOwner(userId)` | Caller's UID == `userId` |
| `getMyProfile()` | `get()` the caller's own user doc (costs 1 read) |
| `isAdmin()` | `getMyProfile().role == 'admin'` |
| `isActive()` | `getMyProfile().accountStatus == 'active'` |

> `isAdmin()` and `isActive()` each cost a Firestore read because they
> `get()` the user doc. Cheap for occasional checks; if admin ops become
> frequent, move the role onto a custom claim on the auth token.

## `/users/{userId}` policy

| Op | Allowed when |
|----|---------------|
| **read** | `isOwner(userId)` OR (`isAuthenticated() && isActive()`) |
| **create** | `isOwner(userId) && role == 'user' && accountStatus == 'active'` (zero trust — no self-promoting to admin) |
| **update** | (`isOwner` + active + cannot touch `role` or `accountStatus`) OR `isAdmin()` |
| **delete** | `isAdmin()` only |

Translation:
- Anyone signed-in & active can read other users' profiles (community feed).
- New users register themselves; the role is hard-coded to `user`.
- Owners can edit their profile *except* role and status.
- Admins can change anything, including suspending users.
- Hard deletes are admin-only.

## Other collections

No rules yet for `/events`, `/books`, `/trades`. Until those exist,
**any read or write to those paths is denied** (default-deny). When you add
them: add a `match` block, use the helpers above, and document the policy
here.

## Local testing

The Firebase emulator suite ships with `firebase emulators:start --only firestore`.
Point a temporary client at the emulator and try writes that *should* fail —
e.g. trying to set `role: 'admin'` on sign-up. If those succeed, the rules
have a hole.
