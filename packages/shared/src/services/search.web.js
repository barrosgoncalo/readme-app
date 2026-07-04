import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase.web"; // <-- A grande diferença: usamos a base de dados web!
import { liteClient } from "algoliasearch/lite";

// No Vite (Web), as variáveis de ambiente usam import.meta.env e começam por VITE_
const API_APP_ID_KEY = import.meta.env.VITE_ALGOLIA_APP_ID;
const API_SEARCH_KEY = import.meta.env.VITE_ALGOLIA_SEARCH_KEY;

const algoliaClient = liteClient(API_APP_ID_KEY, API_SEARCH_KEY);

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

    const { results } = await algoliaClient.search({
        requests: [
            {
                indexName: "users",
                query: trimmed,
                hitsPerPage: resultLimit + 10,
            },
        ],
    });

    const hits = results[0].hits;
    const blockedIds = await getBlockedUserIdSet(currentUserUid);

    return hits
        .map((hit) => ({ uid: hit.objectID, ...hit }))
        .filter((user) => user.uid !== currentUserUid && !blockedIds.has(user.uid))
        .slice(0, resultLimit);
};