import { auth, db } from "./firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword, 
    sendPasswordResetEmail, 
    updatePassword ,
    GoogleAuthProvider
} from "firebase/auth"
import { doc, setDoc } from "firebase/firestore";

export const doCreateUserWithEmailAndPassword = async (email, password) => {
  // 1. Create the user in Firebase Authentication
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 2. Create a companion document in the "users" collection in Firestore
  // We use setDoc instead of addDoc because we want the Document ID to match the Auth UID exactly!
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    displayName: email.split('@')[0], // Temporary username from email
    createdAt: new Date().toISOString(),
    favoriteBooks: [],
  });

  return userCredential;
};

export const doSignInWithEmailAndPassword = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const doSignInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // save user to firebase
    return result;
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
