// @readme/shared/src/models/publication.js

/**
 * Creates a standardized publication object to be saved to the database.
 * @param {string} uid - The ID of the user creating the post (currentUser.uid)
 * @param {string} sellerName - The display name of the user
 * @param {string|null} sellerAvatar - The profile picture URL of the user
 * @param {object} bookData - Object containing book details (title, author, condition, subject, images array, etc.)
 * @param {string} detailsText - The text content of the user's publication
 * @returns {object} The formatted data payload for Firestore
 */

import { PUBLICATION_STATUS } from '../constants/status';

export const createPublicationModel = (uid, sellerName, sellerAvatar, bookData, detailsText = "") => {
    return {
        uid: uid,
        sellerName: sellerName || "Anonymous Swapper",
        sellerAvatar: sellerAvatar || null,
        
        // -- Publication State --
        status: PUBLICATION_STATUS.AVAILABLE,

        // -- Book Details --
        book: {
            title: bookData?.title || "Unknown Title",
            author: bookData?.author || "Unknown Author",
            images: bookData?.images || [],
            bookId: bookData?.bookId || null,
            condition: bookData?.condition || "Not specified",
            subject: bookData?.subject || "Not specified"
        },

        detailsText: detailsText.trim(),

        stats: {
            likesCount: 0,
            commentsCount: 0
        }
    };
};
