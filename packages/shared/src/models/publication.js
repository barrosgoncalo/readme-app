// @readme/shared/src/models/publication.js

/**
 * Creates a standardized publication object to be saved to the database.
 * * @param {string} uid - The ID of the user creating the post (currentUser.uid)
 * @param {object} bookData - Object containing book details (title, author, images array, etc.)
 * @param {string} detailsText - The text content of the user's publication
 * @returns {object} The formatted data payload for Firestore
 */
export const createPublicationModel = (uid, bookData, detailsText = "") => {
    return {
        uid: uid,

        // -- Book Details --
        book: {
            title: bookData?.title || "Unknown Title",
            author: bookData?.author || "Unknown Author",
            // Now strictly handles an array of image addresses from Firebase Storage
            images: bookData?.images || bookData?.coverImages || [],
            bookId: bookData?.bookId || null
        },

        detailsText: detailsText.trim(),

        // -- Timestamps & Stats --
        createdAt: new Date().toISOString(),
        stats: {
            likesCount: 0,
            commentsCount: 0
        }
    };
};
