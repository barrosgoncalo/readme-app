import { auth } from "./firebase";
import {
    createUserWithEmailAndPassword,
    deleteUser,
    signInWithEmailAndPassword, 
    sendPasswordResetEmail, 
    updatePassword,
    reauthenticateWithCredential,
    signInWithCredential,
    sendEmailVerification,
    GoogleAuthProvider,
    EmailAuthProvider,
} from "firebase/auth";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ACCOUNT_STATUS } from "../constants/authConstants";
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

        await deleteUser(currentUser);

    } catch (error) {
        console.error("Error deleting account:", error);
        throw error;
    }
};

/**
 * Updates general user data in Firestore.
 * @param {string} uid - The user's ID
 * @param {object} dataToUpdate - An object containing only the fields you want to change
 */
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

GoogleSignin.configure({
    webClientId: '849676892747-srr6urr1bpdgrplivvemic7skur6pv2q.apps.googleusercontent.com',
    iosClientId: '849676892747-npd5vr8tm11jem3prh2lmsvlcinn79tp.apps.googleusercontent.com',
    offlineAccess: true
});

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
        }
    };
};

export const doSignInWithGoogleCredential = async (idToken, profileData) => {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);

    const userData = await DB.get("users", userCredential.user.uid);

    if (!userData) {
        await saveUserData(userCredential.user.uid, profileData, 'google');
    }

    return userCredential;
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

export const doReauthenticateWithGoogle = async () => {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("No user is currently logged in.");
    }

    try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const userInfo = await GoogleSignin.signIn();

        const idToken = userInfo.data?.idToken || userInfo.idToken;
        if (!idToken) throw new Error("Could not get Google ID Token");

        const credential = GoogleAuthProvider.credential(idToken);
        await reauthenticateWithCredential(user, credential);
        return true;
    } catch (error) {
        console.error("Google reauthentication failed:", error);
        throw error;
    }
};

export const getUserProviderId = () => {
    const user = auth.currentUser;
    if (!user || !user.providerData?.length) return null;

    const hasGoogle = user.providerData.some(p => p.providerId === 'google.com');
    if (hasGoogle) return 'google.com';

    const hasPassword = user.providerData.some(p => p.providerId === 'password');
    if (hasPassword) return 'password';

    return user.providerData[0].providerId;
};
