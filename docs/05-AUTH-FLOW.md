# Auth flows

All flows are implemented in `packages/shared/src/services/auth.shared.js`
(email/password) plus a platform-specific Google flow in
`auth.native.js` / `auth.web.js`. The `AuthProvider` (in
`packages/shared/src/contexts/AuthContext`) listens to
`onAuthStateChanged` and exposes `useAuth()`.

## Register (email)

```
User fills 3-step form (credentials → personal → address)
        │
        ▼
doCreateUserWithEmailAndPassword(email, password, profileData)
        │
        ├─→ Firebase Auth: create user (uid generated)
        ├─→ Firestore: saveUserData(uid, profileData, 'email')
        │     writes users/{uid} with role='user', accountStatus='active'
        └─→ Firebase Auth: sendEmailVerification(currentUser)

User clicks the link in their email → emailVerified = true
        │
        ▼
AuthProvider sees the change, sets userLoggedIn = true → app proceeds to main UI
```

## Register / Sign-in with Google

```
                    ┌─ mobile ─────────────────┐    ┌─ web ─────────────────┐
                    │ GoogleSignin.signIn()    │    │ signInWithPopup(auth, │
                    │  → returns idToken       │    │   new GoogleAuth…())  │
                    └────────────┬─────────────┘    └────────────┬──────────┘
                                 │                                │
                                 ▼                                ▼
                    GoogleAuthProvider.credential(idToken)   signInWithPopup returns
                                 │                            UserCredential directly
                                 ▼
                    signInWithCredential(auth, credential)
                                 │
                                 ▼
                    If users/{uid} doesn't exist:
                       saveUserData(uid, profileData, 'google')
                    Otherwise: just sign in.
```

Google users skip email verification (Google has already verified the email).

## Login (email)

```
doSignInWithEmailAndPassword(email, password)
        │
        ├─→ Firebase Auth: signInWithEmailAndPassword
        ├─→ Firestore: read users/{uid}
        │
        ├─ if userData.accountStatus == 'suspended':
        │     auth.signOut()
        │     throw "Your account has been suspended…"
        │
        └─→ return { user, userData }
```

The `AuthProvider` additionally enforces: **email users with `emailVerified == false`
are treated as logged-out** even though Firebase Auth happily kept the session.

## Forgot password

```
doPasswordReset(email)
        │
        └─→ Firebase Auth: sendPasswordResetEmail
              user clicks link, sets new password directly with Firebase.
              No code path inside our app handles the reset itself.
```

## Sign out

```
doSignOut()
        │
        └─→ auth.signOut()
              AuthProvider's onAuthStateChanged fires with null
              → currentUser = null, userLoggedIn = false
              → app routes back to Login
```

## What the client sees

```js
const { currentUser, userLoggedIn, loading } = useAuth();
```

- `loading` = waiting for the first `onAuthStateChanged` event. Show a spinner.
- `userLoggedIn` = `false` ⇒ render the auth stack (Splash / Welcome / Login / etc.).
- `userLoggedIn` = `true` ⇒ render the authenticated UI.
- `currentUser.uid` is the Firestore doc key. Read the user profile via
  `getDoc(doc(db, 'users', currentUser.uid))` when needed.

## What we are NOT building

- No custom JWT, no PBKDF2 hashing, no custom session store.
  Firebase Auth handles all of that.
- No "remember me" toggle — persistence is already `browserLocalPersistence`
  on web and AsyncStorage on mobile, so sessions survive reloads.
