// @readme/shared/src/models/publication.js

/**
 * Creates a standardized publication object to be saved to the database.
 * @param {string} uid - The ID of the user creating the post (currentUser.uid)
 * @param {object} bookData - Object containing book details (title, author, condition, subject, images array, etc.)
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
            images: bookData?.images || bookData?.coverImages || [],
            bookId: bookData?.bookId || null,
            condition: bookData?.condition || "Not specified",
            subject: bookData?.subject || "Not specified"
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
