import { auth } from './firebase.web'; 
import { DB } from './DB';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail, 
    updatePassword, 
    signInWithPopup, 
    sendEmailVerification, 
    GoogleAuthProvider, 
    EmailAuthProvider, 
    reauthenticateWithPopup,
    reauthenticateWithCredential, 
    deleteUser, 
} from 'firebase/auth'; 
import { USER_ROLES, ACCOUNT_STATUS, ACCOUNT_VISIBILITY } from '../constants/authConstants'; 

export const saveUserData = async (uid, profileData, provider) => { 
    const payload = {
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
        favoriteBooks: [], 
        authProvider: provider, 
    };

    // DB.create applies { createdAt: serverTimestamp() } automatically under the hood
    await DB.create('users', payload, uid); 
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

    // DB.get returns the data object if it exists, or null
    const userData = await DB.get('users', user.uid); 

    if (!userData) { 
        throw new Error('User profile not found.'); 
    } 

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

    const userData = await DB.get('users', user.uid); 

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

export const doSignOut = () => auth.signOut(); 

export const doPasswordReset = (email) => sendPasswordResetEmail(auth, email); 

export const doPasswordChange = (password) => updatePassword(auth.currentUser, password); 

export const doSendEmailVerification = () => sendEmailVerification(auth.currentUser); 

export const doUpdateUserPassword = async (currentPassword, newPassword) => { 
    const user = auth.currentUser; 
    if (!user) throw new Error('No user is currently logged in.'); 

    const credential = EmailAuthProvider.credential(user.email, currentPassword); 
    await reauthenticateWithCredential(user, credential); 
    await updatePassword(user, newPassword); 
}; 

export const doDeleteUserProfile = async (uid) => {
    const user = auth.currentUser;
    if (!user || user.uid !== uid) throw new Error('No user is currently logged in or UID mismatch.');

    // Delete Firestore profile first via DB abstraction, then the Auth account.
    await DB.remove('users', user.uid);
    await deleteUser(user);
};

export const doReauthenticateWithPassword = async (password) => {
    const user = auth.currentUser;
    if (!user) throw new Error('No user is currently logged in.');

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
};

export const doReauthenticateWithGoogle = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('No user is currently logged in.');

    const provider = new GoogleAuthProvider();
    await reauthenticateWithPopup(user, provider);
};
