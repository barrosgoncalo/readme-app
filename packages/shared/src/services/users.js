import { auth, db } from './firebase';
import { collection, doc, getDoc, getDocs, query, where, documentId, arrayUnion, arrayRemove, increment, writeBatch, updateDoc } from 'firebase/firestore';
import { getFollowId, createFollow } from '../models/follow';

const USERS_COLLECTION = 'users';

export async function getUserById(uid) {
    if (!uid) return null;
    const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
}

export async function getUsersByIds(uids) {
    if (!uids || uids.length === 0) return {};

    const chunks = [];
    for (let i = 0; i < uids.length; i += 10) {
        chunks.push(uids.slice(i, i + 10));
    }

    const results = await Promise.all(
        chunks.map(async (chunk) => {
            const q = query(
                collection(db, USERS_COLLECTION),
                where(documentId(), 'in', chunk),
            );
            const snapshot = await getDocs(q);
            const map = {};
            snapshot.docs.forEach((d) => {
                map[d.id] = {
                    username: d.data().username,
                    fullName: d.data().fullName,
                    photoURL: d.data().photoURL || null,
                };
            });
            return map;
        })
    );

    return results.reduce((acc, map) => ({ ...acc, ...map }), {});
}

/**
 * Fetches a user's profile and checks if the current user is following them.
 */
export const fetchUserProfile = async (userId) => {
    if (!userId) throw new Error("User ID is required to fetch profile.");

    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return null;
        }

        const userData = userSnap.data();
        let isCurrentUserFollowing = false;

        const currentUserId = auth?.currentUser?.uid;

        if (currentUserId && currentUserId !== userId) {
            const followDocId = getFollowId(currentUserId, userId);
            const followRef = doc(db, 'follows', followDocId);
            const followSnap = await getDoc(followRef);

            isCurrentUserFollowing = followSnap.exists();
        }

        return {
            id: userSnap.id,
            ...userData,
            followers: userData.followersCount || 0,
            following: userData.followingCount || 0,
            isCurrentUserFollowing: isCurrentUserFollowing
        };

    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
    }
};

/**
 * Toggle favorite status on a publication.
 */
export const toggleFavoriteStatus = async (userId, pubId, isCurrentlyFavorited) => {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    const publicationDocRef = doc(db, 'publications', pubId);

    await Promise.all([
        updateDoc(userDocRef, {
            favoriteBooks: !isCurrentlyFavorited ? arrayUnion(pubId) : arrayRemove(pubId)
        }),
        updateDoc(publicationDocRef, {
            "stats.likesCount": increment(!isCurrentlyFavorited ? 1 : -1)
        })
    ]);
};

/**
 * Toggle follow status between current user and target user.
 */
export const toggleFollowUser = async (targetUserId, shouldFollow) => {
    const currentUserId = auth?.currentUser?.uid;

    if (!currentUserId) throw new Error("Authentication required to follow users.");
    if (!targetUserId || typeof targetUserId !== 'string') throw new Error("Valid Target User ID string required.");

    const batch = writeBatch(db);

    const followDocId = getFollowId(currentUserId, targetUserId);
    const followRef = doc(db, 'follows', followDocId);

    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    if (shouldFollow) {
        batch.set(followRef, createFollow(currentUserId, targetUserId));
        batch.update(currentUserRef, { followingCount: increment(1) });
        batch.update(targetUserRef, { followersCount: increment(1) });
    } else {
        batch.delete(followRef);
        batch.update(currentUserRef, { followingCount: increment(-1) });
        batch.update(targetUserRef, { followersCount: increment(-1) });
    }

    await batch.commit();
};

/**
 * Fetch list of users the given user is following.
 */
export const getFollowing = async (uid) => {
    const q = query(collection(db, 'follows'), where('followerUid', '==', uid));
    const snapshot = await getDocs(q);

    return Promise.all(
        snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const followingUid = data.followingUid;

            let username = null;
            let fullName = null;
            let avatarUrl = null;
            try {
                const userSnap = await getDoc(doc(db, USERS_COLLECTION, followingUid));
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    username = userData.username ?? null;
                    fullName = userData.fullName ?? null;
                    avatarUrl = userData.photoURL ?? null;
                }
            } catch (error) {
                console.error(`Failed to fetch profile for following user ${followingUid}:`, error);
            }

            return {
                id: followingUid,
                username,
                fullName,
                avatarUrl,
                createdAt: data.createdAt || null,
            };
        })
    );
};

/**
 * Fetch list of users following the given user.
 */
export const getFollowers = async (uid) => {
    const q = query(collection(db, 'follows'), where('followingUid', '==', uid));
    const snapshot = await getDocs(q);

    return Promise.all(
        snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const followerUid = data.followerUid;

            let username = null;
            let fullName = null;
            let avatarUrl = null;
            try {
                const userSnap = await getDoc(doc(db, USERS_COLLECTION, followerUid));
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    username = userData.username ?? null;
                    fullName = userData.fullName ?? null;
                    avatarUrl = userData.photoURL ?? null;
                }
            } catch (error) {
                console.error(`Failed to fetch profile for follower ${followerUid}:`, error);
            }

            return {
                id: followerUid,
                username,
                fullName,
                avatarUrl,
                createdAt: data.createdAt || null,
            };
        })
    );
};
