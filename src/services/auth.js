import { auth, db } from "./firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword, 
    sendPasswordResetEmail, 
    updatePassword ,
    signInWithCredential,
    sendEmailVerification,
    GoogleAuthProvider
} from "firebase/auth"
import { doc, setDoc } from "firebase/firestore";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { USER_ROLES, ACCOUNT_STATUS, ACCOUNT_VISIBILITY } from "../constants/authConstants";

export const saveUserData = async (uid, profileData, provider) => {
    await setDoc(doc(db, "users", uid), {
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
            country: profileData.country
        },
        createdAt: new Date().toISOString(),
        favoriteBooks: [],
        authProvider: provider
    });
};

export const doCreateUserWithEmailAndPassword = async (email, password, profileData) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await saveUserData(user.uid, { ...profileData, email }, 'email');

    await doSendEmailVerification();

    return userCredential;
};

export const doSignInWithEmailAndPassword = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
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
            username: googleUser?.email ? googleUser.email.split('@')[0] : ''
        }
    };
};

export const doSignInWithGoogleCredential = async (idToken, profileData) => {
  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);
  
  await saveUserData(userCredential.user.uid, profileData, 'google');
  
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
