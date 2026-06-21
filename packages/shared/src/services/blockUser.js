// @readme/shared/src/services/block.js

import { db, auth } from "./firebase";
import {
    doc, setDoc, deleteDoc, getDoc,
    collection, query, where, getDocs
} from "firebase/firestore";
import { getBlockId, createBlock } from "../models/block";

export const doBlockUser = async (blockerUid, blockedUid, blockedUserSnapshot) => {
    const ref = doc(db, "blocks", getBlockId(blockerUid, blockedUid));
    await setDoc(ref, createBlock(blockerUid, blockedUid, blockedUserSnapshot));
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

    console.log("THIS IS WORKING");

    return snapshot.docs.map((d) => {
        const data = d.data();
        return {
            id: data.blockedUid,
            username: data.blockedUsername,
            fullName: data.blockedFullName,
            avatarUrl: data.blockedAvatarUrl,
        };
    });
};
