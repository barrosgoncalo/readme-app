// Web auth — mirrors the export surface of ./auth.js (mobile).
// Email/password and Firestore writes are identical; Google sign-in uses
// signInWithPopup instead of @react-native-google-signin.
import { auth, db } from './firebase.web';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updatePassword,
    signInWithPopup,
    sendEmailVerification,
    GoogleAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { USER_ROLES, ACCOUNT_STATUS, ACCOUNT_VISIBILITY } from '../constants/authConstants';

// Same Firestore write as mobile's saveUserData — kept in sync deliberately.
export const saveUserData = async (uid, profileData, provider) => {
    await setDoc(doc(db, 'users', uid), {
        uid: uid,
        userId: profileData.email.trim().toLowerCase(),
        username: profileData.username,
        fullName: profileData.fullName,
        phoneNumber: profileData.phoneNumber,
        dob: profileData.dob,
        profileVisibility: profileData.isPublic
            ? ACCOUNT_VISIBILITY.PUBLIC
            : ACCOUNT_VISIBILITY.PRIVATE,
        role: USER_ROLES.USER,
        accountStatus: ACCOUNT_STATUS.ACTIVE,
        institutionalAddress: {
            addressLine1: profileData.addressLine1,
            addressLine2: profileData.addressLine2 || null,
            city: profileData.city,
            district: profileData.district,
            postalCode: profileData.zipCode,
            country: profileData.country,
        },
        createdAt: new Date().toISOString(),
        favoriteBooks: [],
        authProvider: provider,
    });
};

export const doCreateUserWithEmailAndPassword = async (email, password, profileData) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await saveUserData(user.uid, { ...profileData, email }, 'email');

    await doSendEmailVerification();

    return userCredential;
};

export const doSignInWithEmailAndPassword = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        throw new Error('User profile not found.');
    }

    const userData = userDoc.data();
    if (userData.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
        await auth.signOut();
        throw new Error('Your account has been suspended. Please contact support.');
    }

    return { user, userData };
};

// Web Google sign-in: popup-based. Caller may pass profileData for the first-time
// case (when the users/{uid} doc doesn't exist yet). If not supplied, we derive a
// minimal profile from the Google account.
export const doSignInWithGoogle = async (profileData) => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

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
        };
        await saveUserData(user.uid, { ...fallback, ...(profileData || {}) }, 'google');
    }

    return userCredential;
};

export const doSignOut = () => auth.signOut();

export const doPasswordReset = (email) => sendPasswordResetEmail(auth, email);

export const doPasswordChange = (password) => updatePassword(auth.currentUser, password);

export const doSendEmailVerification = () => sendEmailVerification(auth.currentUser);
