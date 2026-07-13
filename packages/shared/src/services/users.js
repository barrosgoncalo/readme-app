// @readme/shared/src/services/users.js

import { auth, storage } from "./firebase";
import { 
    documentId,
    arrayUnion,
    arrayRemove,
    increment,
} from "firebase/firestore";
import { getFollowId, createFollow, createFollowRequest } from '../models/follow';
import { StorageService } from "./storage";

import { DB } from './DB';

const USERS_COLLECTION = 'users';

export const UsersService = {

    /**
    * Resolves a display name from either a canonical Firestore user doc
    * (username/fullName) or a raw Firebase Auth user object (displayName),
    * in case currentUser is ever the latter.
    */
    getDisplayName: (user) => {
        return user?.username || user?.fullName || user?.displayName || 'Anonymous Swapper';
    },

    /**
    * Resolves an avatar URL from either shape.
    */
    getAvatarUrl: (user) => {
        return user?.photoURL || null;
    },

    /**
    * Fetches a user's profile and checks if the current user is following them.
    * @param {string} userId - The ID of the profile being viewed
    */
    fetchUserProfile: async (userId) => {
        if (!userId) throw new Error("User ID is required to fetch profile.");

        try {
            const userData = await DB.get(USERS_COLLECTION, userId);
            if (!userData) return null;

            let isCurrentUserFollowing = false;
            let isRequestPending = false;
            const currentUserId = auth?.currentUser?.uid;

            if (currentUserId && currentUserId !== userId) {
                const relationshipId = getFollowId(currentUserId, userId);
                const followData = await DB.get('follows', relationshipId);
                isCurrentUserFollowing = !!followData;

                if (!isCurrentUserFollowing) {
                    const requestData = await DB.get('followRequests', relationshipId);
                    isRequestPending = !!requestData;
                }
            }

            return {
                ...userData,
                followers: userData.followersCount || 0,
                following: userData.followingCount || 0,
                isCurrentUserFollowing,
                isRequestPending,
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
    * Toggles follow status. If the target is private and the action is "follow",
    * this sends a pending request instead of following directly.
    */
    toggleFollowUser: async (targetUserId, shouldFollow, isTargetPrivate = false) => {
        const currentUserId = auth?.currentUser?.uid;

        if (!currentUserId) throw new Error("Authentication required to follow users.");
        if (!targetUserId || typeof targetUserId !== 'string') throw new Error("Valid Target User ID string required.");

        const relationshipId = getFollowId(currentUserId, targetUserId);

        if (shouldFollow && isTargetPrivate) {
            await DB.create('followRequests', createFollowRequest(currentUserId, targetUserId), relationshipId);
            return;
        }

        if (shouldFollow) {
            await Promise.all([
                DB.create('follows', createFollow(currentUserId, targetUserId), relationshipId),
                DB.update(USERS_COLLECTION, currentUserId, { followingCount: increment(1) }),
                DB.update(USERS_COLLECTION, targetUserId, { followersCount: increment(1) })
            ]);
        } else {
            await Promise.all([
                DB.remove('follows', relationshipId),
                DB.update(USERS_COLLECTION, currentUserId, { followingCount: increment(-1) }),
                DB.update(USERS_COLLECTION, targetUserId, { followersCount: increment(-1) })
            ]);
        }
    },

    /**
    * Accepts a pending follow request: creates the actual follow relationship,
    * increments counts, and removes the request doc.
    */
    acceptFollowRequest: async (targetUserId, requesterUid) => {
        const relationshipId = getFollowId(requesterUid, targetUserId);

        await Promise.all([
            DB.create('follows', createFollow(requesterUid, targetUserId), relationshipId),
            DB.update(USERS_COLLECTION, requesterUid, { followingCount: increment(1) }),
            DB.update(USERS_COLLECTION, targetUserId, { followersCount: increment(1) }),
            DB.remove('followRequests', relationshipId),
        ]);
    },

    /**
    * Declines a pending follow request: just removes the request doc, no counts change.
    */
    declineFollowRequest: async (targetUserId, requesterUid) => {
        const relationshipId = getFollowId(requesterUid, targetUserId);
        await DB.remove('followRequests', relationshipId);
    },

    /**
    * Fetches raw pending follow requests for a given user (the target).
    * Returns request docs only (requesterUid, id) — resolving requester profile
    * details (name/avatar) for display is left to whichever screen consumes this.
    */
    fetchPendingFollowRequests: async (userId) => {
        if (!userId) return [];
        return await DB.get('followRequests', [
            { field: 'targetUid', operator: '==', value: userId }
        ]);
    },
};
