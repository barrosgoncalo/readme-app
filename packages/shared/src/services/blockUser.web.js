// Web variant of blockUser.js — mirrors the export surface, but imports the
// browser Firebase entry. Keep in sync with blockUser.js when changing.
import { db } from "./firebase.web";
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

// Lightweight version — returns just the set of blocked UIDs. Use when you only
// need to filter content, not render profiles.
export const doGetBlockedUids = async (blockerUid) => {
    const q = query(collection(db, "blocks"), where("blockerUid", "==", blockerUid));
    const snapshot = await getDocs(q);
    return new Set(snapshot.docs.map(d => d.data().blockedUid));
};

// Returns blocked users as ready-to-render profile objects (id, username, fullName, avatarUrl).
// Any uid whose user doc no longer exists is dropped from the result.
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
                createdAt: blockData.createdAt || null,
            };
        })
    );

    return profiles;
};
