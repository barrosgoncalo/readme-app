// Formats a book's `authors` field (array or string) into a display string.
export function formatAuthors(authors) {
    return Array.isArray(authors) ? authors.join(', ') : (authors || '');
}
