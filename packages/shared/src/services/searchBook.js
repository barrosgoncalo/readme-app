// @readme/shared/src/services/searchBook.js

import { algoliasearch } from "algoliasearch";
import { PUBLICATION_STATUS } from "../constants/status";

const API_APP_ID_KEY = process.env.EXPO_PUBLIC_ALGOLIA_APP_ID;
const API_SEARCH_KEY = process.env.EXPO_PUBLIC_ALGOLIA_SEARCH_KEY;

const algoliaClient = algoliasearch(API_APP_ID_KEY, API_SEARCH_KEY);

const PUBLICATIONS_INDEX = "publications";
const RESULTS_PER_PAGE = 8; // matches the max-10-per-page requirement

/**
 * Autocomplete-style search returning unique book suggestions (text only)
 * as the user types.
 *
 * Deduplicates multiple publications of the same book by checking for
 * matching bookIds OR matching Title+Author combinations.
 */
export const searchBookTitles = async (searchText, resultLimit = 15) => {
    const trimmed = searchText.trim();
    if (!trimmed) return [];

    const { results } = await algoliaClient.search({
        requests: [
            {
                indexName: PUBLICATIONS_INDEX,
                query: trimmed,
                // Only search title/author fields so a match on detailsText
                // or seller name doesn't pollute book suggestions
                restrictSearchableAttributes: ["book.title", "book.author"],
                filters: `status:${PUBLICATION_STATUS.AVAILABLE}`,
                // Fetch more than we need since many hits will collapse
                // into the same book after dedup
                hitsPerPage: resultLimit * 5,
                typoTolerance: true,
            },
        ],
    });

    const hits = results[0]?.hits || [];

    const seenIds = new Set();
    const seenTitleAuthors = new Set();
    const suggestions = [];

    for (const hit of hits) {
        const bookId = hit.book?.bookId || null;
        const title = hit.book?.title || "Unknown Title";
        const author = hit.book?.author || "Unknown Author";

        // Create a normalized composite key for Title + Author
        const titleAuthorKey = `${title.trim().toLowerCase()}|${author.trim().toLowerCase()}`;

        // Skip if we've already seen this exact Title/Author OR this exact bookId
        if (seenTitleAuthors.has(titleAuthorKey) || (bookId && seenIds.has(bookId))) {
            continue;
        }

        // Mark as seen
        seenTitleAuthors.add(titleAuthorKey);
        if (bookId) seenIds.add(bookId);

        suggestions.push({
            // Provide a stable key for React mapping
            key: bookId ? `id:${bookId}` : `ta:${titleAuthorKey}`,
            bookId,
            title,
            author,
        });

        if (suggestions.length >= resultLimit) break;
    }

    return suggestions;
};

/**
 * Fetches available publications for a given book, paginated 10-at-a-time
 * (Google-style numbered pages), used on the results page after a
 * suggestion is tapped or the user presses enter on the search bar.
 *
 * IMPORTANT: this deliberately runs a *text* query against title/author
 * (with typoTolerance on) rather than a strict `book.bookId` facet filter.
 * That's what lets near-matches and other editions of the same book
 * ("Harry Poter and the Philosopher Stone", a hardcover vs. paperback
 * edition, etc.) show up side by side, exactly like the Figma reference.
 *
 * If a bookId is known (the user tapped a specific suggestion), its
 * publications are nudged to the top via optionalFilters — a *soft*
 * boost, not a hard filter, so similar books still appear beneath it.
 *
 * @param {{ bookId?: string, title: string, author?: string }} book
 * @param {{ page?: number, hitsPerPage?: number }} pagination - page is 0-indexed, like Algolia
 */
export const searchPublicationsByBook = async (
    { bookId, title, author },
    { page = 0, hitsPerPage = RESULTS_PER_PAGE } = {}
) => {
    const queryText = [title, author].filter(Boolean).join(" ").trim();

    const searchParams = {
        indexName: PUBLICATIONS_INDEX,
        query: queryText,
        restrictSearchableAttributes: ["book.title", "book.author"],
        filters: `status:${PUBLICATION_STATUS.AVAILABLE}`,
        page,
        hitsPerPage,
        typoTolerance: true,
        // If the exact query returns nothing, progressively drop trailing
        // words instead of showing an empty page (tolerates partial/garbled titles)
        removeWordsIfNoResults: "lastWords",
    };

    if (bookId) {
        // Soft-boost: same book ranks first, everything else still shows
        searchParams.optionalFilters = [`book.bookId:${bookId}<score=2>`];
    }

    const { results } = await algoliaClient.search({ requests: [searchParams] });
    const result = results[0] || {};
    const hits = result.hits || [];

    const publications = hits.map((hit) => ({
        id: hit.objectID,
        uid: hit.uid || null,
        title: hit.book?.title || "Unknown Title",
        author: hit.book?.author || "Unknown Author",
        imageUrl: hit.book?.images?.[0] || null,
        bookId: hit.book?.bookId || null,
        seller: {
            name: hit.sellerName || "Anonymous Swapper",
            avatarUrl: hit.sellerAvatar || null,
        },
        favoriteCount: hit.stats?.likesCount || 0,
        publicationData: hit,
    }));

    return {
        publications,
        page: result.page ?? page,
        nbPages: result.nbPages ?? 1,
        nbHits: result.nbHits ?? publications.length,
    };
};