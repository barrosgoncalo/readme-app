// @readme/shared/src/services/users.js

import { auth, storage } from "./firebase";
import { 
    documentId,
    arrayUnion,
    arrayRemove,
    increment,
} from "firebase/firestore";
import { getFollowId, createFollow } from '../models/follow';
import { StorageService } from "./storage";

import { DB } from './DB';

const USERS_COLLECTION = 'users';

export const UsersService = {
    /**
     * Fetches a user's profile and checks if the current user is following them.
     * @param {string} userId - The ID of the profile being viewed
     */
    fetchUserProfile: async (userId) => {
        if (!userId) throw new Error("User ID is required to fetch profile.");

        try {
            const userData = await DB.get(USERS_COLLECTION, userId);

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
    },

    /**
     * Fetches a user's list of favorite books.
     * @param {string} userId - The ID of the user
     * @returns {Promise<Array>} Array of favorite book IDs
     */
    fetchUserFavorites: async (userId) => {
        if (!userId) return [];

        try {
            const userData = await DB.get(USERS_COLLECTION, userId);
            return userData?.favoriteBooks || [];
        } catch (error) {
            console.error("Error fetching user favorites:", error);
            throw error;
        }
    },

    /**
     * Fetches multiple users by an array of UIDs, handling Firestore's 10-item 'in' query limit.
     * Returns a dictionary mapped by UID.
     */
    getUsersByIds: async (uids) => {
        if (!uids || uids.length === 0) return {};

        const users = await DB.get(USERS_COLLECTION, [
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
    },

    /**
     * Executes a dual-document batch update to toggle favorite statuses.
     */
    toggleFavoriteStatus: async (userId, bookId, isCurrentlyFavorited) => {
        await Promise.all([
            DB.update(USERS_COLLECTION, userId, { 
                favoriteBooks: !isCurrentlyFavorited ? arrayUnion(bookId) : arrayRemove(bookId) 
            }),
            
            DB.update('publications', bookId, { 
                "stats.likesCount": increment(!isCurrentlyFavorited ? 1 : -1) 
            })
        ]);
    },

    /**
     * Uploads a profile picture to Firebase Storage and updates the user's Firestore document.
     */
    uploadProfilePicture: async (userId, imageUri) => {
        const downloadUrl = await StorageService.uploadImage(imageUri, `profile_pictures/${userId}`);

        await DB.update(USERS_COLLECTION, userId, {
            photoURL: downloadUrl
        });

        return downloadUrl;
    },

    /**
     * Toggles the follow status between the current logged-in user and a target user.
     * @param {string} targetUserId - The ID of the profile being followed (passed from UI)
     * @param {boolean} shouldFollow - True to follow, False to unfollow (passed from UI)
     */
    toggleFollowUser: async (targetUserId, shouldFollow) => {
        const currentUserId = auth?.currentUser?.uid; 

        if (!currentUserId) throw new Error("Authentication required to follow users.");
        if (!targetUserId || typeof targetUserId !== 'string') throw new Error("Valid Target User ID string required.");

        const followDocId = getFollowId(currentUserId, targetUserId);

        if (shouldFollow) {
            await Promise.all([
                DB.create('follows', createFollow(currentUserId, targetUserId), followDocId),
                DB.update(USERS_COLLECTION, currentUserId, { followingCount: increment(1) }),
                DB.update(USERS_COLLECTION, targetUserId, { followersCount: increment(1) })
            ]);
        } else {
            await Promise.all([
                DB.remove('follows', followDocId),
                DB.update(USERS_COLLECTION, currentUserId, { followingCount: increment(-1) }),
                DB.update(USERS_COLLECTION, targetUserId, { followersCount: increment(-1) })
            ]);
        }
    }
};
