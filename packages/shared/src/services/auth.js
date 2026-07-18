// Web auth — mirrors the export surface of ./auth.js (mobile).
import { auth } from './firebase.web';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updatePassword,
    signInWithPopup,
    sendEmailVerification,
    GoogleAuthProvider,
    EmailAuthProvider,
    reauthenticateWithCredential,
    deleteUser,
} from 'firebase/auth';

import { ACCOUNT_STATUS } from '../constants/authConstants';
import { createUserModel } from '@readme/shared/src/models/user';
import { DB } from '@readme/shared/src/services/DB';

export const saveUserData = async (uid, profileData, provider) => {
    const userData = createUserModel(uid, profileData, provider);
    await DB.create("users", userData, uid);
};

export const doDeleteUserProfile = async (uid) => {
    try {
        const currentUser = auth.currentUser;
        
        if (!currentUser || currentUser.uid !== uid) {
            throw new Error("No authenticated user found or UID mismatch.");
        }

        // Web doesn't handle the native storage deletion here, but we do clean up Firestore & Auth
        await DB.remove('users', uid);
        await deleteUser(currentUser);
        
    } catch (error) {
        console.error("Error deleting account:", error);
        throw error;
    }
};

export const doUpdateUserProfile = async (uid, dataToUpdate) => {
    try {
        await DB.update("users", uid, dataToUpdate);
        return true;
    } catch (error) {
        console.error("Error updating profile in Firestore:", error);
        throw error;
    }
};

export const doCreateUserWithEmailAndPassword = async (email, password, profileData) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await saveUserData(user.uid, { ...profileData, email }, 'email');
    await doSendEmailVerification();

    return userCredential;
};

export const doSignInWithEmailAndPassword = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        const userData = await DB.get("users", user.uid);

        if (userData) {
            if (userData.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
                await auth.signOut();
                throw new Error("Your account has been suspended. Please contact support.");
            }
            return { user, userData };
        } else {
            throw new Error("User profile not found.");
        }
    } catch (error) {
        console.error("Login Error:", error);
        throw error;
    }
};

// Web-specific: Single step popup login (Used by your current web UI)
export const doSignInWithGoogle = async (profileData) => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    const userData = await DB.get("users", user.uid);

    if (!userData) {
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
        };
        await saveUserData(user.uid, { ...fallback, ...(profileData || {}) }, 'google');
    }

    return userCredential;
};

// Dummy functions to mirror mobile's 2-step Google Auth surface (prevents import errors)
export const doGetGoogleTokenAndProfile = async () => {
    throw new Error("doGetGoogleTokenAndProfile is a mobile-only function. Use doSignInWithGoogle on web.");
};

export const doSignInWithGoogleCredential = async (idToken, profileData) => {
    throw new Error("doSignInWithGoogleCredential is a mobile-only function. Use doSignInWithGoogle on web.");
};

export const doSignOut = () => {
    return auth.signOut();
};

export const doPasswordReset = (email) => {
    return sendPasswordResetEmail(auth, email);
};

export const doPasswordChange = (password) => {
    return updatePassword(auth.currentUser, password);
};

export const doSendEmailVerification = () => {
    return sendEmailVerification(auth.currentUser);
};

export const doUpdateUserPassword = async (currentPassword, newPassword) => {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("No user is currently logged in.");
    }

    try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);

        return { success: true, message: "Password updated successfully!" };
    } catch (error) {
        console.log("Firebase password update failed:", error.code);
        
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
            throw new Error("The current password you entered is incorrect.");
        }
        if (error.code === 'auth/weak-password') {
            throw new Error("The new password is too weak. Please use at least 6 characters.");
        }
        
        throw new Error("An error occurred while changing your password. Please try again.");
    }
};

export const doReauthenticateWithPassword = async (password) => {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("No user is currently logged in.");
    }

    try {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
        return true;
    } catch (error) {
        console.error("Reauthentication failed:", error);
        throw error;
    }
};
