import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, __getPlatform } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence} from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
    FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID
} from '@readme/shared/src/constants/env'; 

// 2. USA AS VARIÁVEIS IMPORTADAS AQUI
const firebaseConfig = {
    apiKey: FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
    messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
    appId: FIREBASE_APP_ID,
    measurementId: FIREBASE_MEASUREMENT_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = initializeFirestore(app, {
    experimentalAutoDetectPersistence: true
});
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const storage = getStorage(app);
const functions = getFunctions(app, 'europe-west1');

export { app, db, auth, storage, functions };
