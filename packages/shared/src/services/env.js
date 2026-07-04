// Mobile env access (Expo/Metro inlines process.env.EXPO_PUBLIC_* at build time).
// Web uses env.web.js instead (Vite resolve.extensions picks it automatically).
export const ALGOLIA_APP_ID = process.env.EXPO_PUBLIC_ALGOLIA_APP_ID;
export const ALGOLIA_SEARCH_KEY = process.env.EXPO_PUBLIC_ALGOLIA_SEARCH_KEY;
