// Web route paths. Not to be confused with packages/shared/src/constants/routes.ts,
// which holds React Navigation route *names* for mobile.
export const WEB_ROUTES = {
    WELCOME: '/welcome',
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    BOOKS: '/books',
    BOOKS_SCAN: '/books/scan',
    TRADES: '/trades',
    EVENTS: '/events',
    MAP: '/map',
    CHAT: '/chat',
    PROFILE: '/profile',
    PROFILE_EDIT: '/profile/edit',
    eventDetails: (eventId) => `/events/${eventId}`,
};
