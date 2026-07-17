// Firestore timestamp fields may arrive as a Firestore Timestamp instance,
// a plain {seconds, nanoseconds} object (e.g. after JSON serialization), or a
// legacy ISO string, depending on which client/version wrote the document.
// Normalize any of these shapes to milliseconds since epoch for sorting/display.
export function toMillis(value) {
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.seconds === 'number') {
        return value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1e6);
    }
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
}
