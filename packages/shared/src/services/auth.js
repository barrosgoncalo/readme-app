import { auth, db } from "./firebase";
import {
    createUserWithEmailAndPassword,
    deleteUser,
    signInWithEmailAndPassword, 
    sendPasswordResetEmail, 
    updatePassword ,
    reauthenticateWithCredential,
    signInWithCredential,
    sendEmailVerification,
    GoogleAuthProvider,
    EmailAuthProvider,
} from "firebase/auth"
import { doc, setDoc, deleteDoc, getDoc, updateDoc } from "firebase/firestore";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ACCOUNT_STATUS } from "../constants/authConstants";
import { createUserModel } from '@readme/shared/src/models/user';

export const saveUserData = async (uid, profileData, provider) => {
    const userData = createUserModel(uid, profileData, provider);
    await setDoc(doc(db, "users", uid), userData);
};

export const doDeleteUserProfile = async (uid) => {
    try {
        const currentUser = auth.currentUser;
        
        if (!currentUser || currentUser.uid !== uid) {
            throw new Error("No authenticated user found or UID mismatch.");
        }

        const userRef = doc(db, 'users', uid);
        await deleteDoc(userRef);

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
        const userDocRef = doc(db, "users", uid);

        await updateDoc(userDocRef, {
            ...dataToUpdate,
            updatedAt: new Date().toISOString()
        });

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

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();

            if (userData.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
                await auth.signOut(); // Force log them back out
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

    const userDocRef = doc(db, "users", userCredential.user.uid);
    const userDoc = await getDoc(userDocRef);

    if(!userDoc.exists()) {
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
