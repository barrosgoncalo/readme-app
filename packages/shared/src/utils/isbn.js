// Strip any character that isn't a digit or the ISBN-10 check character 'X'.
// Use for normalising an ISBN before using it as a Firestore doc ID.
export function sanitizeIsbn(isbn) {
    if (!isbn) return null;
    const stripped = String(isbn).replace(/[^0-9Xx]/g, '');
    return stripped || null;
}
