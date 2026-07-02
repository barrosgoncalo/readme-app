import { auth, db } from "./firebase";
import {
    createUserWithEmailAndPassword,
    deleteUser,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updatePassword,
    reauthenticateWithCredential,
    signInWithCredential,
    signInWithPopup,
    sendEmailVerification,
    GoogleAuthProvider,
    EmailAuthProvider,
} from "firebase/auth";
import { doc, setDoc, deleteDoc, getDoc, updateDoc } from "firebase/firestore";
// RN-only. Aliased to a no-op stub in apps/web/vite.config.js — the
// mobile-specific Google sign-in helpers below are never called on web,
// which uses signInWithPopup (doSignInWithGoogle) instead.
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ACCOUNT_STATUS } from "../constants/authConstants";
import { createUserModel } from '../models/user';

export const saveUserData = async (uid, profileData, provider) => {
    const userData = createUserModel(uid, profileData, provider);
    await setDoc(doc(db, "users", uid), userData);
};

// ── Profile maintenance ──────────────────────────────────────────────────────

export const doUpdateUserProfile = async (uid, dataToUpdate) => {
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, {
        ...dataToUpdate,
        updatedAt: new Date().toISOString(),
    });
    return true;
};

// Mobile-style account deletion: takes the uid and deletes the Firestore doc
// + the currently-signed-in Auth user. No password reauthentication.
export const doDeleteUserProfile = async (uid) => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== uid) {
        throw new Error("No authenticated user found or UID mismatch.");
    }
    await deleteDoc(doc(db, 'users', uid));
    await deleteUser(currentUser);
};

// Web-style account deletion: re-authenticates with the user's current password
// before destroying the Auth user + Firestore profile. Safer for password users.
export const doDeleteAccount = async (currentPassword) => {
    const user = auth.currentUser;
    if (!user) throw new Error('No user is currently logged in.');
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await deleteDoc(doc(db, 'users', user.uid));
    await deleteUser(user);
};

// ── Email / password ─────────────────────────────────────────────────────────

export const doCreateUserWithEmailAndPassword = async (email, password, profileData) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await saveUserData(userCredential.user.uid, { ...profileData, email }, 'email');
    await doSendEmailVerification();
    return userCredential;
};

export const doSignInWithEmailAndPassword = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) throw new Error("User profile not found.");

    const userData = userDoc.data();
    if (userData.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
        await auth.signOut();
        throw new Error("Your account has been suspended. Please contact support.");
    }

    return { user, userData };
};

// ── Google sign-in ───────────────────────────────────────────────────────────
// Mobile uses the native module to get an idToken first; web pops a Firebase
// auth window directly. Each platform calls only its own helper.

GoogleSignin.configure({
    webClientId: '849676892747-srr6urr1bpdgrplivvemic7skur6pv2q.apps.googleusercontent.com',
    iosClientId: '849676892747-npd5vr8tm11jem3prh2lmsvlcinn79tp.apps.googleusercontent.com',
    offlineAccess: true,
});

// Mobile-only helpers.
export const doGetGoogleTokenAndProfile = async () => {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const userInfo = await GoogleSignin.signIn();

    const idToken = userInfo.data?.idToken || userInfo.idToken;
    if (!idToken) throw new Error("Não foi possível obter o ID Token da Google");

    const googleUser = userInfo.data?.user || userInfo.user;
    return {
        idToken,
        profile: {
            email: googleUser?.email || '',
            fullName: googleUser?.name || googleUser?.displayName || '',
            username: googleUser?.email ? googleUser.email.split('@')[0] : '',
            photoURL: googleUser?.photo || '',
        },
    };
};

export const doSignInWithGoogleCredential = async (idToken, profileData) => {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);

    const userDocRef = doc(db, "users", userCredential.user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
        await saveUserData(userCredential.user.uid, profileData, 'google');
    }
    return userCredential;
};

// Web-only helper.
export const doSignInWithGoogle = async (profileData) => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
        const fallback = {
            email: user.email || '',
            fullName: user.displayName || '',
            username: user.email ? user.email.split('@')[0] : '',
            phoneNumber: '',
            dob: '',
            isPublic: true,
            addressLine1: '',
            addressLine2: '',
            city: '',
            district: '',
            zipCode: '',
            country: '',
            photoURL: user.photoURL || null,
        };
        await saveUserData(user.uid, { ...fallback, ...(profileData || {}) }, 'google');
    }
    return userCredential;
};

// ── Misc auth utilities ──────────────────────────────────────────────────────

export const doSignOut = () => auth.signOut();

export const doPasswordReset = (email) => sendPasswordResetEmail(auth, email);

export const doPasswordChange = (password) => updatePassword(auth.currentUser, password);

export const doSendEmailVerification = () => sendEmailVerification(auth.currentUser);

export const doUpdateUserPassword = async (currentPassword, newPassword) => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user is currently logged in.");

    try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        return { success: true, message: "Password updated successfully!" };
    } catch (error) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
            throw new Error("The current password you entered is incorrect.");
        }
        if (error.code === 'auth/weak-password') {
            throw new Error("The new password is too weak. Please use at least 6 characters.");
        }
        throw new Error("An error occurred while changing your password. Please try again.");
    }
};
