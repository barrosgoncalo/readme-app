// @readme/shared/src/services/bookSearch.js

import { algoliasearch } from "algoliasearch";
import { PUBLICATION_STATUS } from "../constants/status";

const API_APP_ID_KEY = process.env.EXPO_PUBLIC_ALGOLIA_APP_ID;
const API_SEARCH_KEY = process.env.EXPO_PUBLIC_ALGOLIA_SEARCH_KEY;

const algoliaClient = algoliasearch(API_APP_ID_KEY, API_SEARCH_KEY);

const PUBLICATIONS_INDEX = "publications";

/**
 * Builds a stable key to dedupe publications that represent the "same book".
 * Prefers book.bookId (canonical catalog id) since it tolerates title
 * variations like "(Collector's Edition)" or different subtitle formatting.
 * Falls back to a normalized title when bookId isn't available.
 */
const getGroupKey = (hit) => {
    if (hit.book?.bookId) return `id:${hit.book.bookId}`;
    return `title:${(hit.book?.title || "").trim().toLowerCase()}`;
};

/**
 * Autocomplete-style search returning unique book suggestions (text only)
 * as the user types, e.g. "harry p" -> ["Harry Potter and the Chamber of
 * Secrets", "Harry Potter and the Philosopher's Stone", ...]
 *
 * Deduplicates multiple publications of the same book down to one suggestion.
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
            },
        ],
    });

    const hits = results[0]?.hits || [];

    const seen = new Map();
    for (const hit of hits) {
        const key = getGroupKey(hit);
        if (!seen.has(key)) {
            seen.set(key, {
                key,
                bookId: hit.book?.bookId || null,
                title: hit.book?.title || "Unknown Title",
                author: hit.book?.author || "Unknown Author",
            });
        }
        if (seen.size >= resultLimit) break;
    }

    return Array.from(seen.values());
};

/**
 * Fetches all available publications for a given book, used on the results
 * page after a suggestion is tapped. Prefers bookId for an exact, tolerant
 * match; falls back to title if bookId isn't available (e.g. legacy data).
 */
export const searchPublicationsByBook = async ({ bookId, title }, resultLimit = 50) => {
    const filterParts = [`status:${PUBLICATION_STATUS.AVAILABLE}`];

    if (bookId) {
        filterParts.push(`book.bookId:"${bookId}"`);
    }

    const { results } = await algoliaClient.search({
        requests: [
            {
                indexName: PUBLICATIONS_INDEX,
                query: bookId ? "" : title, // exact facet filter if we have bookId, else fall back to a text query
                filters: filterParts.join(" AND "),
                hitsPerPage: resultLimit,
            },
        ],
    });

    const hits = results[0]?.hits || [];
    return hits.map((hit) => ({ id: hit.objectID, ...hit }));
};