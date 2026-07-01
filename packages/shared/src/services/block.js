// @readme/shared/src/services/block.js

import { db, auth } from "./firebase";
import {
    doc, setDoc, deleteDoc, getDoc,
    collection, query, where, getDocs
} from "firebase/firestore";
import { getBlockId, createBlock } from "../models/block";

export const doBlockUser = async (blockerUid, blockedUid) => {
    const ref = doc(db, "blocks", getBlockId(blockerUid, blockedUid));
    await setDoc(ref, createBlock(blockerUid, blockedUid));
};

export const doUnblockUser = async (blockerUid, blockedUid) => {
    const ref = doc(db, "blocks", getBlockId(blockerUid, blockedUid));
    await deleteDoc(ref);
};

export const doIsBlocked = async (uidA, uidB) => {
    const [aBlockedB, bBlockedA] = await Promise.all([
        getDoc(doc(db, "blocks", getBlockId(uidA, uidB))),
        getDoc(doc(db, "blocks", getBlockId(uidB, uidA))),
    ]);
    return aBlockedB.exists() || bBlockedA.exists();
};

/**
 * Returns the blocked users as ready-to-render profile objects,
 * not just their uids — fetches the `blocks` docs, then resolves
 * each blockedUid against the `users` collection in parallel.
 * Any uid that no longer has a user doc (deleted account) is dropped.
 */
export const doGetBlockedUsers = async (blockerUid) => {
    const q = query(collection(db, "blocks"), where("blockerUid", "==", blockerUid));
    const snapshot = await getDocs(q);

    const profiles = await Promise.all(
        snapshot.docs.map(async (blockDoc) => {
            const blockData = blockDoc.data();
            const blockedUid = blockData.blockedUid;

            let username = blockData.blockedUsername ?? null;
            let fullName = blockData.blockedFullName ?? null;
            let avatarUrl = blockData.blockedAvatarUrl ?? null;

            try {
                const userSnap = await getDoc(doc(db, "users", blockedUid));
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    username = userData.username ?? username;
                    fullName = userData.fullName ?? fullName;
                    avatarUrl = userData.photoURL ?? avatarUrl;
                }
            } catch (error) {
                console.error(`Failed to fetch profile for blocked user ${blockedUid}:`, error);
            }

            return {
                id: blockedUid,
                username,
                fullName,
                avatarUrl,
            };
        })
    );

    return profiles;
};

export const doGetBlockedUids = async (blockerUid) => {
    if (!blockerUid) return [];
    
    try {
        const q = query(collection(db, "blocks"), where("blockerUid", "==", blockerUid));
        const snapshot = await getDocs(q);
        
        // Return a simple array of strings: ['uid1', 'uid2', ...]
        return snapshot.docs.map(doc => doc.data().blockedUid);
    } catch (error) {
        console.error("Error fetching blocked UIDs:", error);
        return [];
    }
};
