// Shared across web and mobile. The `./firebase` import resolves to firebase.web.js
// on web (via Vite resolve.extensions) and firebase.js on mobile (via Metro).
import { db } from "./firebase";
import {
    doc, setDoc, deleteDoc, getDoc,
    collection, query, where, getDocs
} from "firebase/firestore";
import { getFriendId, createFriend } from "../models/friend";

export const doAddFriend = async (userUid, friendUid) => {
    const ref = doc(db, "friends", getFriendId(userUid, friendUid));
    await setDoc(ref, createFriend(userUid, friendUid));
};

export const doRemoveFriend = async (userUid, friendUid) => {
    const ref = doc(db, "friends", getFriendId(userUid, friendUid));
    await deleteDoc(ref);
};

export const doIsFriend = async (userUid, friendUid) => {
    const snap = await getDoc(doc(db, "friends", getFriendId(userUid, friendUid)));
    return snap.exists();
};

export const doGetFriends = async (userUid) => {
    const q = query(collection(db, "friends"), where("userUid", "==", userUid));
    const snapshot = await getDocs(q);

    return Promise.all(
        snapshot.docs.map(async (friendDoc) => {
            const data = friendDoc.data();
            const friendUid = data.friendUid;

            let username = null;
            let fullName = null;
            let avatarUrl = null;
            try {
                const userSnap = await getDoc(doc(db, "users", friendUid));
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    username = userData.username ?? null;
                    fullName = userData.fullName ?? null;
                    avatarUrl = userData.photoURL ?? null;
                }
            } catch (error) {
                console.error(`Failed to fetch profile for friend ${friendUid}:`, error);
            }

            return {
                id: friendUid,
                username,
                fullName,
                avatarUrl,
                createdAt: data.createdAt || null,
            };
        })
    );
};
