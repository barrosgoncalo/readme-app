import { WEB_ROUTES } from '../constants/webRoutes';

const WIDE_PREFIXES = [
    WEB_ROUTES.BOOKS,
    WEB_ROUTES.EVENTS,
    WEB_ROUTES.EXPLORE,
    '/users/',
    '/publications/',
];

// Detail routes (Books, Events, Publications) need the 'wide' tier to make
// full use of the screen — 'reading' would squeeze them into a narrow
// column. No detail route currently needs a standalone narrow reading
// width, so this list is intentionally empty.
const READING_PATTERNS = [];

const NARROW_PREFIXES = [
    WEB_ROUTES.PROFILE,
    WEB_ROUTES.PUBLICATION_NEW,
    WEB_ROUTES.OFFERS_NEW,
];

/** @returns {'wide' | 'reading' | 'narrow' | 'full'} */
export function getContentWidthTier(pathname) {
    if (pathname.startsWith(WEB_ROUTES.CHAT)) return 'full';
    if (pathname === WEB_ROUTES.BOOKS || pathname === WEB_ROUTES.EVENTS || pathname === WEB_ROUTES.EXPLORE) {
        return 'wide';
    }
    if (READING_PATTERNS.some(pattern => pattern.test(pathname))) return 'reading';
    if (NARROW_PREFIXES.some(prefix => pathname.startsWith(prefix))) return 'narrow';
    if (WIDE_PREFIXES.some(prefix => pathname.startsWith(prefix))) return 'wide';
    return 'narrow';
}
