import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
// 1. Import the Algolia 'lite' client (optimized for frontend search)
import { liteClient } from "algoliasearch/lite";
import { ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY } from "./env";

// 2. Initialize the client.
// CRITICAL: Only use your Search-Only API Key here. NEVER put your Admin Key in frontend code.
const algoliaClient = liteClient(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);



const getBlockedUserIdSet = async (currentUserUid) => {
    const blocksRef = collection(db, "blocks");

    const [blockedByMeSnap, blockedMeSnap] = await Promise.all([
        getDocs(query(blocksRef, where("blockerUid", "==", currentUserUid))),
        getDocs(query(blocksRef, where("blockedUid", "==", currentUserUid))),
    ]);

    const ids = new Set();
    blockedByMeSnap.docs.forEach((doc) => ids.add(doc.data().blockedUid));
    blockedMeSnap.docs.forEach((doc) => ids.add(doc.data().blockerUid));

    return ids;
};

export const searchUsers = async (searchText, currentUserUid, resultLimit = 20) => {
    const trimmed = searchText.trim();
    if (!trimmed) return [];

    // 3. Query Algolia instead of Firestore
    const { results } = await algoliaClient.search({
        requests: [
            {
                indexName: "users", // Must match the index name you set in the Firebase Extension
                query: trimmed,
                // Fetch a few extra results just in case the top hits happen to be blocked users
                hitsPerPage: resultLimit + 10,
            },
        ],
    });

    // Algolia returns data inside the 'hits' array
    const hits = results[0].hits;

    // 4. Fetch the blocked IDs from Firestore (your existing logic)
    const blockedIds = await getBlockedUserIdSet(currentUserUid);

    // 5. Format and filter the results
    return hits
        .map((hit) => {
            // The Firebase Extension automatically saves the Firestore document ID as the Algolia 'objectID'
            return { uid: hit.objectID, ...hit };
        })
        .filter((user) => user.uid !== currentUserUid && !blockedIds.has(user.uid))
        .slice(0, resultLimit); // Enforce the final limit after filtering out blocked users
};