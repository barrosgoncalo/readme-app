import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "./firebase";

// If services/block.js already has an equivalent helper (e.g. getBlockedUserIds),
// use that instead of this one to avoid duplicating logic.
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

    const usersRef = collection(db, "users");
    const q = query(
        usersRef,
        where("username", ">=", trimmed),
        where("username", "<=", trimmed + "\uf8ff"),
        orderBy("username"),
        limit(resultLimit)
    );

    const snapshot = await getDocs(q);
    const blockedIds = await getBlockedUserIdSet(currentUserUid);

    return snapshot.docs
        .map((doc) => ({ uid: doc.id, ...doc.data() }))
        .filter((user) => user.uid !== currentUserUid && !blockedIds.has(user.uid));
};