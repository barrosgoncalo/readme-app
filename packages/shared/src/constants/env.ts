// @readme/shared/src/constants/env.ts
// Usado pelo Expo (React Native)

export const FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY as string;
export const FIREBASE_AUTH_DOMAIN = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN as string;
export const FIREBASE_PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID as string;
export const FIREBASE_STORAGE_BUCKET = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET as string;
export const FIREBASE_MESSAGING_SENDER_ID = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string;
export const FIREBASE_APP_ID = process.env.EXPO_PUBLIC_FIREBASE_APP_ID as string;
export const FIREBASE_MEASUREMENT_ID = process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID as string;

export const GOOGLE_BOOKS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY as string;

export const ALGOLIA_APP_ID = process.env.EXPO_PUBLIC_ALGOLIA_APP_ID as string;
export const ALGOLIA_SEARCH_KEY = process.env.EXPO_PUBLIC_ALGOLIA_SEARCH_KEY as string;

// Other App Settings
export const APP_THEME_MODE = process.env.EXPO_PUBLIC_APP_THEME_MODE as string;
export const MAX_BOOK_SEARCH_RESULTS = process.env.EXPO_PUBLIC_MAX_BOOK_SEARCH_RESULTS as string;