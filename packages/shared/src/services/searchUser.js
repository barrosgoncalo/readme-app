// 🔴 Firebase imports completely removed!
import { DB } from "./DB";
import { algoliasearch } from "algoliasearch";

const API_APP_ID_KEY = process.env.EXPO_PUBLIC_ALGOLIA_APP_ID;
const API_SEARCH_KEY = process.env.EXPO_PUBLIC_ALGOLIA_SEARCH_KEY;

const algoliaClient = algoliasearch(API_APP_ID_KEY, API_SEARCH_KEY);

const getBlockedUserIdSet = async (currentUserUid) => {
    const [blockedByMe, blockedMe] = await Promise.all([
        DB.get("blocks", [{ field: "blockerUid", operator: "==", value: currentUserUid }]),
        DB.get("blocks", [{ field: "blockedUid", operator: "==", value: currentUserUid }]),
    ]);

    const ids = new Set();
    blockedByMe.forEach((block) => ids.add(block.blockedUid));
    blockedMe.forEach((block) => ids.add(block.blockerUid));

    return ids;
};

export const searchUsers = async (searchText, currentUserUid, resultLimit = 20) => {
    const trimmed = searchText.trim();
    if (!trimmed) return [];

    const { results } = await algoliaClient.search({
        requests: [
            {
                indexName: "users",
                query: trimmed,
                hitsPerPage: resultLimit + 10,
            },
        ],
    });

    const hits = results[0]?.hits || [];

    const blockedIds = await getBlockedUserIdSet(currentUserUid);

    return hits
        .map((hit) => {
            return { uid: hit.objectID, ...hit };
        })
        .filter((user) => user.uid !== currentUserUid && !blockedIds.has(user.uid))
        .slice(0, resultLimit);
};
