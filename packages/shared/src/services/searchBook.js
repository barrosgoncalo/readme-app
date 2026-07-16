import { algoliasearch } from "algoliasearch";
import { documentId } from "firebase/firestore";
import { PUBLICATION_STATUS } from "../constants/status";
import { ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY } from '../constants/env';
import { DB } from './DB';

const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);

const PUBLICATIONS_INDEX = "publications";
const DEFAULT_HITS_PER_PAGE = 15;

// Algolia can only re-sort results using replica indices with a custom
// ranking configured (set up in the Algolia dashboard, or via setSettings
// with a `replicas` array on the primary index). "relevance" uses the
// primary index as-is; everything else routes to a replica.
export const SORT_OPTIONS = {
    RELEVANCE: 'relevance',
    TITLE_ASC: 'title_asc',
    TITLE_DESC: 'title_desc',
    FAVORITES_DESC: 'favorites_desc',
    FAVORITES_ASC: 'favorites_asc',
    DATE_DESC: 'date_desc',
    DATE_ASC: 'date_asc',
};

const SORT_INDEXES = {
    [SORT_OPTIONS.RELEVANCE]: PUBLICATIONS_INDEX,
    [SORT_OPTIONS.TITLE_ASC]: `${PUBLICATIONS_INDEX}_title_asc`,
    [SORT_OPTIONS.TITLE_DESC]: `${PUBLICATIONS_INDEX}_title_desc`,
    [SORT_OPTIONS.FAVORITES_DESC]: `${PUBLICATIONS_INDEX}_favorites_desc`,
    [SORT_OPTIONS.FAVORITES_ASC]: `${PUBLICATIONS_INDEX}_favorites_asc`,
    [SORT_OPTIONS.DATE_DESC]: `${PUBLICATIONS_INDEX}_date_desc`,
    [SORT_OPTIONS.DATE_ASC]: `${PUBLICATIONS_INDEX}_date_asc`,
};

/**
 * Autocomplete-style search returning unique book suggestions (text only)
 * as the user types.
 *
 * Deduplicates multiple publications of the same book by checking for
 * matching bookIds OR matching Title+Author combinations.
 */
export const searchBookTitles = async (searchText, resultLimit = DEFAULT_HITS_PER_PAGE, excludeUid = null) => {
    const trimmed = searchText.trim();
    if (!trimmed) return [];

    const filters = excludeUid
        ? `status:${PUBLICATION_STATUS.AVAILABLE} AND NOT uid:${excludeUid}`
        : `status:${PUBLICATION_STATUS.AVAILABLE}`;

    const { results } = await algoliaClient.search({
        requests: [
            {
                indexName: PUBLICATIONS_INDEX,
                query: trimmed,
                restrictSearchableAttributes: ["book.title", "book.author"],
                filters,
                hitsPerPage: resultLimit,
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

        const titleAuthorKey = `${title.trim().toLowerCase()}|${author.trim().toLowerCase()}`;

        if (seenTitleAuthors.has(titleAuthorKey) || (bookId && seenIds.has(bookId))) {
            continue;
        }

        seenTitleAuthors.add(titleAuthorKey);
        if (bookId) seenIds.add(bookId);

        suggestions.push({
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
 * Builds the Algolia `filters` string for the AVAILABLE status plus any
 * selected book-condition facets (OR'd together within the group, ANDed
 * against status).
 */
const buildPublicationFilters = (conditions = [], genres = [], excludeUid = null, blockedUids = []) => {
    let filters = `status:${PUBLICATION_STATUS.AVAILABLE}`;

    if (excludeUid) {
        filters += ` AND NOT uid:${excludeUid}`;
    }

    // Fine for a handful of blocks. If blocklists can grow large (dozens+),
    // this filter string will hit Algolia's length limit — you'd want a
    // different strategy then (e.g. a `blockedBy` attribute synced via a
    // Cloud Function), but this covers your current scale.
    blockedUids.forEach((uid) => {
        filters += ` AND NOT uid:${uid}`;
    });

    if (conditions.length > 0) {
        const conditionGroup = conditions.map((c) => `book.condition:"${c}"`).join(" OR ");
        filters += ` AND (${conditionGroup})`;
    }

    if (genres.length > 0) {
        const genreGroup = genres.map((g) => `book.subject:"${g}"`).join(" OR ");
        filters += ` AND (${genreGroup})`;
    }

    return filters;
};

/**
 * Fetches available publications for a given book, paginated 10-at-a-time
 * (Google-style numbered pages), used on the results page after a
 * suggestion is tapped or the user presses enter on the search bar.
 *
 * Supports optional filtering by book condition and sorting via Algolia
 * replica indices (see SORT_OPTIONS / SORT_INDEXES above — the replicas
 * must exist in your Algolia app for anything other than 'relevance').
 *
 * IMPORTANT: on the relevance index, this deliberately runs a *text* query
 * against title/author (with typoTolerance on) rather than a strict
 * `book.bookId` facet filter. That's what lets near-matches and other
 * editions of the same book show up side by side. On sorted replicas the
 * custom ranking takes over, so the bookId soft-boost only applies to
 * the relevance case.
 *
 * @param {{ bookId?: string, title: string, author?: string }} book
 * @param {{ page?: number, hitsPerPage?: number, sortBy?: string, conditions?: string[] }} options - page is 0-indexed, like Algolia
 */
export const searchPublicationsByBook = async (
    { bookId, title, author },
    { page = 0, hitsPerPage = DEFAULT_HITS_PER_PAGE, sortBy = SORT_OPTIONS.RELEVANCE, conditions = [], genres = [], excludeUid = null } = {}
) => {
    const queryText = [title, author].filter(Boolean).join(" ").trim();
    const indexName = SORT_INDEXES[sortBy] || SORT_INDEXES[SORT_OPTIONS.RELEVANCE];

    const searchParams = {
        indexName,
        query: queryText,
        restrictSearchableAttributes: ["book.title", "book.author"],
        filters: buildPublicationFilters(conditions, genres, excludeUid),
        page,
        hitsPerPage,
        typoTolerance: true,
        removeWordsIfNoResults: "lastWords",
    };

    if (bookId && sortBy === SORT_OPTIONS.RELEVANCE) {
        searchParams.optionalFilters = [`book.bookId:${bookId}<score=2>`];
    }

    let results;
    try {
        ({ results } = await algoliaClient.search({ requests: [searchParams] }));
    } catch (error) {
        // Replica index not created yet (or misconfigured) — fall back to
        // relevance rather than surfacing a broken screen to the user.
        if (error?.status === 404 && indexName !== PUBLICATIONS_INDEX) {
            console.warn(`Sort index "${indexName}" not found, falling back to relevance.`);
            searchParams.indexName = PUBLICATIONS_INDEX;
            if (bookId) searchParams.optionalFilters = [`book.bookId:${bookId}<score=2>`];
            ({ results } = await algoliaClient.search({ requests: [searchParams] }));
        } else {
            throw error;
        }
    }

    const result = results[0] || {};
    const hits = result.hits || [];

    const publications = hits.map((hit) => ({
        id: hit.objectID,
        uid: hit.uid || null,
        title: hit.book?.title || "Unknown Title",
        author: hit.book?.author || "Unknown Author",
        imageUrl: hit.book?.images?.[0] || null,
        bookId: hit.book?.bookId || null,
        condition: hit.book?.condition || "Not specified",
        subject: hit.book?.subject || "Not specified",
        seller: {
            name: hit.sellerName || "Anonymous Swapper",
            avatarUrl: hit.sellerAvatar || null,
        },
        favoriteCount: hit.stats?.likesCount || 0,
        createdAt: hit.createdAt || null,
        publicationData: hit,
    }));

    return {
        publications,
        page: result.page ?? page,
        nbPages: result.nbPages ?? 1,
        nbHits: result.nbHits ?? publications.length,
        sortBy,
        conditions,
    };
};


/**
 * Browses ALL available publications (no query text), paginated —
 * powers the Explore feed. Same filter/sort machinery as
 * searchPublicationsByBook, just without a text query.
 */
export const browsePublications = async ({
                                             page = 0,
                                             hitsPerPage = DEFAULT_HITS_PER_PAGE,
                                             sortBy = SORT_OPTIONS.DATE_DESC,
                                             conditions = [],
                                             genres = [],
                                             excludeUid = null,
                                             blockedUids = [],
                                         } = {}) => {
    const indexName = SORT_INDEXES[sortBy] || SORT_INDEXES[SORT_OPTIONS.RELEVANCE];

    const { results } = await algoliaClient.search({
        requests: [{
            indexName,
            query: '',
            filters: buildPublicationFilters(conditions, genres, excludeUid, blockedUids),
            page,
            hitsPerPage,
        }],
    });

    const result = results[0] || {};
    const hits = result.hits || [];

    const publications = hits.map((hit) => ({
        id: hit.objectID,
        uid: hit.uid || null,
        title: hit.book?.title || "Unknown Title",
        author: hit.book?.author || "Unknown Author",
        imageUrl: hit.book?.images?.[0] || null,
        bookId: hit.book?.bookId || null,
        condition: hit.book?.condition || "Not specified",
        subject: hit.book?.subject || "Not specified",
        seller: { name: hit.sellerName || "Anonymous Swapper", avatarUrl: hit.sellerAvatar || null },
        favoriteCount: hit.stats?.likesCount || 0,
        createdAt: hit.createdAt || null,
        publicationData: hit,
    }));

    return {
        publications,
        page: result.page ?? page,
        nbPages: result.nbPages ?? 1,
        nbHits: result.nbHits ?? publications.length,
    };
};

/**
 * ADMIN DASHBOARD: returns publication counts grouped by seller country.
 * Reads available publications from Firestore, resolves each seller's
 * institutionalAddress.country, and aggregates the counts.
 */
export const getPublicationsCountsByCountry = async () => {
    const publications = await DB.get('publications', [
        { field: 'status', operator: '==', value: PUBLICATION_STATUS.AVAILABLE },
    ]);

    if (!publications?.length) return [];

    const pubsByUid = {};
    for (const pub of publications) {
        const uid = pub.uid;
        if (!uid) continue;
        pubsByUid[uid] = (pubsByUid[uid] || 0) + 1;
    }

    const uids = Object.keys(pubsByUid);
    if (!uids.length) return [];

    const users = await DB.get('users', [
        { field: documentId(), operator: 'in', value: uids },
    ]);

    const countryCounts = {};
    const fetchedUids = new Set();

    for (const user of users) {
        fetchedUids.add(user.id);
        const country = user.institutionalAddress?.country?.trim() || 'Unknown';
        countryCounts[country] = (countryCounts[country] || 0) + pubsByUid[user.id];
    }

    for (const uid of uids) {
        if (!fetchedUids.has(uid)) {
            countryCounts.Unknown = (countryCounts.Unknown || 0) + pubsByUid[uid];
        }
    }

    return Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count);
};
