// @readme/shared/src/services/users.js

import { auth, storage } from "./firebase";
import { 
    documentId,
    arrayUnion,
    arrayRemove,
    increment,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFollowId, createFollow } from '../models/follow';

import { DB } from './DB';

const USERS_COLLECTION = 'users';

/**
 * Fetches a user's profile and checks if the current user is following them.
 * @param {string} userId - The ID of the profile being viewed
 */
export const fetchUserProfile = async (userId) => {
    if (!userId) throw new Error("User ID is required to fetch profile.");

    try {
        const userData = await DB.get('users', userId);

        if (!userData) {
            return null;
        }

        let isCurrentUserFollowing = false;
        const currentUserId = auth?.currentUser?.uid;
        
        if (currentUserId && currentUserId !== userId) {
            const followDocId = getFollowId(currentUserId, userId);
            const followData = await DB.get('follows', followDocId);
            
            isCurrentUserFollowing = !!followData;
        }

        return {
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
 * Fetches multiple users by an array of UIDs, handling Firestore's 10-item 'in' query limit.
 * Returns a dictionary mapped by UID.
 */
export async function getUsersByIds(uids) {
    if (!uids || uids.length === 0) return {};

    const users = await DB.get('users', [
        { field: documentId(), operator: 'in', value: uids }
    ]);

    // Map into the expected dictionary format
    const map = {};
    users.forEach((u) => {
        map[u.id] = {
            username: u.username,
            fullName: u.fullName,
        };
    });
    
    return map;
}

/**
 * Executes a dual-document batch update to toggle favorite statuses.
 */
export const toggleFavoriteStatus = async (userId, bookId, isCurrentlyFavorited) => {
    await Promise.all([
        DB.update(USERS_COLLECTION, userId, { 
            favoriteBooks: !isCurrentlyFavorited ? arrayUnion(bookId) : arrayRemove(bookId) 
        }),
        
        DB.update('publications', bookId, { 
            "stats.likesCount": increment(!isCurrentlyFavorited ? 1 : -1) 
        })
    ]);
};

/**
 * Uploads a profile picture to Firebase Storage and updates the user's Firestore document.
 */
export const uploadProfilePicture = async (userId, imageUri) => {
    try {
        console.log("A preparar a imagem para upload...", imageUri);

        const blob = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function() { resolve(xhr.response); };
            xhr.onerror = function(e) {
                console.error("Erro na conversão XHR:", e);
                reject(new TypeError('A conversão de rede falhou'));
            };
            xhr.responseType = 'blob';
            xhr.open('GET', imageUri, true);
            xhr.send(null);
        });

        console.log("Blob criado com sucesso! Tamanho:", blob.size);

        const storageRef = ref(storage, `profile_pictures/${userId}`);
        await uploadBytes(storageRef, blob);

        const downloadUrl = await getDownloadURL(storageRef);
        console.log("Upload concluído! URL:", downloadUrl);

        await DB.update(USERS_COLLECTION, userId, {
            photoURL: downloadUrl
        });

        return downloadUrl;

    } catch (error) {
        console.error("Erro fatal no uploadProfilePicture:", error);
        throw error;
    }
};

/**
 * Toggles the follow status between the current logged-in user and a target user.
 * @param {string} targetUserId - The ID of the profile being followed (passed from UI)
 * @param {boolean} shouldFollow - True to follow, False to unfollow (passed from UI)
 */
export const toggleFollowUser = async (targetUserId, shouldFollow) => {
    const currentUserId = auth?.currentUser?.uid; 

    if (!currentUserId) throw new Error("Authentication required to follow users.");
    if (!targetUserId || typeof targetUserId !== 'string') throw new Error("Valid Target User ID string required.");

    const followDocId = getFollowId(currentUserId, targetUserId);

    if (shouldFollow) {
        await Promise.all([
            DB.create('follows', createFollow(currentUserId, targetUserId), followDocId),
            DB.update('users', currentUserId, { followingCount: increment(1) }),
            DB.update('users', targetUserId, { followersCount: increment(1) })
        ]);
    } else {
        await Promise.all([
            DB.remove('follows', followDocId),
            DB.update('users', currentUserId, { followingCount: increment(-1) }),
            DB.update('users', targetUserId, { followersCount: increment(-1) })
        ]);
    }
};
