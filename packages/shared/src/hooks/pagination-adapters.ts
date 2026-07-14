/**
 * Wraps an Algolia-style page-based search fn into the
 * {items, nextCursor, hasMore} shape usePaginatedList expects.
 * Cursor here is just an integer page number.
 */
export function algoliaPageAdapter(searchFn) {
    return async (cursor) => {
        const page = cursor ?? 0;
        const result = await searchFn({ page });
        return {
            items: result.publications ?? [],
            nextCursor: page + 1,
            hasMore: (page + 1) < (result.nbPages ?? 1),
        };
    };
}

/**
 * Wraps a Firestore cursor-based fetch — expects
 * fetchFn(cursor) => {items, lastDoc, hasMore}.
 * Use for Favorites / Reviews / Currently Reading — collections not
 * synced to Algolia.
 */
export function firestoreCursorAdapter(fetchFn) {
    return async (cursor) => {
        const { items, lastDoc, hasMore } = await fetchFn(cursor);
        return { items, nextCursor: lastDoc, hasMore };
    };
}