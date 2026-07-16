// @readme/shared/src/constants/env.web.ts
// Usado pelo Vite (Web)

// 1. Avisamos o TypeScript que o import.meta tem uma propriedade "env"
declare global {
    interface ImportMeta {
        readonly env: Record<string, string>;
    }
}

export const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY as string;
export const FIREBASE_AUTH_DOMAIN = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string;
export const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID as string;
export const FIREBASE_STORAGE_BUCKET = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string;
export const FIREBASE_MESSAGING_SENDER_ID = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string;
export const FIREBASE_APP_ID = import.meta.env.VITE_FIREBASE_APP_ID as string;
export const FIREBASE_MEASUREMENT_ID = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string;

export const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY as string;

export const ALGOLIA_APP_ID = import.meta.env.VITE_ALGOLIA_APP_ID as string;
export const ALGOLIA_SEARCH_KEY = import.meta.env.VITE_ALGOLIA_SEARCH_KEY as string;

// Fallbacks seguros para as chaves que não existem no .env do Vite
// Mantemos a exportação para garantir que a interface (API contract) é igual ao env.ts
export const APP_THEME_MODE = 'dark' as string;
export const MAX_BOOK_SEARCH_RESULTS = '25' as string;