// Web variant of searchUser.js — identical logic, but reads Algolia keys via
// import.meta.env (Vite) instead of process.env.EXPO_PUBLIC_* (Expo/mobile
// only — `process` doesn't exist in a browser and throws a ReferenceError).
import { algoliasearch } from "algoliasearch";

const API_APP_ID_KEY = import.meta.env.VITE_ALGOLIA_APP_ID;
const API_SEARCH_KEY = import.meta.env.VITE_ALGOLIA_SEARCH_KEY;

const algoliaClient = algoliasearch(API_APP_ID_KEY, API_SEARCH_KEY);

const USERS_INDEX = "users";
const DEFAULT_HITS_PER_PAGE = 20;

/**
 * Builds the Algolia `filters` string excluding the current user and any
 * blocked users. Filters directly on `objectID` since that's set to the
 * user's uid when the record is indexed — no separate `uid` facet
 * attribute needed (Algolia's objectID is filterable by default).
 */
const buildUserFilters = (excludeUid = null, blockedUids = []) => {
    const clauses = [];

    if (excludeUid) {
        clauses.push(`NOT objectID:${excludeUid}`);
    }

    blockedUids.forEach((uid) => {
        clauses.push(`NOT objectID:${uid}`);
    });

    return clauses.join(" AND ");
};

/**
 * Paginated user search, used on the People tab of the Explore page.
 *
 * @param {string} searchText
 * @param {{ page?: number, hitsPerPage?: number, excludeUid?: string, blockedUids?: string[] }} options - page is 0-indexed, like Algolia
 */
export const searchUsers = async (
    searchText,
    { page = 0, hitsPerPage = DEFAULT_HITS_PER_PAGE, excludeUid = null, blockedUids = [] } = {}
) => {
    const trimmed = searchText.trim();
    if (!trimmed) {
        return { users: [], page: 0, nbPages: 1, nbHits: 0 };
    }

    const filters = buildUserFilters(excludeUid, blockedUids);

    const { results } = await algoliaClient.search({
        requests: [
            {
                indexName: USERS_INDEX,
                query: trimmed,
                ...(filters ? { filters } : {}),
                page,
                hitsPerPage,
            },
        ],
    });

    const result = results[0] || {};
    const hits = result.hits || [];

    const users = hits.map((hit) => ({ uid: hit.objectID, ...hit }));

    return {
        users,
        page: result.page ?? page,
        nbPages: result.nbPages ?? 1,
        nbHits: result.nbHits ?? users.length,
    };
};
