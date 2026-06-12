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

export const doCreateUserWithEmailAndPassword = async (username, email, password) => {

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    displayName: username,
    createdAt: new Date().toISOString(),
    favoriteBooks: [],
  });

  return userCredential;
};

export const doSignInWithEmailAndPassword = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

GoogleSignin.configure({
  webClientId: '849676892747-srr6urr1bpdgrplivvemic7skur6pv2q.apps.googleusercontent.com.apps.googleusercontent.com',
});

export const doSignInWithGoogle = async () => {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  
  const userInfo = await GoogleSignin.signIn();
  
  const idToken = userInfo.data?.idToken || userInfo.idToken;
  if (!idToken) throw new Error("Não foi possível obter o ID Token da Google");

  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
};

export const doSignOut = () => {
    return auth.signOut();
};

export const doPasswordReset = () => {
    return sendPasswordResetEmail();
};

export const doPasswordChanghe = () => {
    return updatePassword(auth.currentUser, password);
};

export const doSendEmailVerification = () => {
    return sendEmailVerification( auth.currentUser, {
        url: `${window.location.origin}/home`
    });
};
