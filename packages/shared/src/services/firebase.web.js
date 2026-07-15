// Web Firebase init — Vite env vars.
// Mirrors packages/shared/src/services/firebase.js but for the DOM.
//
// Uses getAuth(), not initializeAuth(): initializeAuth() is for environments
// without window (React Native, etc.) and needs an explicit
// popupRedirectResolver to support signInWithPopup/signInWithRedirect.
// getAuth() wires that up automatically and already defaults to
// browserLocalPersistence in a browser context.
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const db = initializeFirestore(app, {
    experimentalAutoDetectPersistence: true,
});

const auth = getAuth(app);

const storage = getStorage(app);

const functions = getFunctions(app, 'europe-west1');

export { app, db, auth, storage, functions };
