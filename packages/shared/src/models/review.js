// @readme/shared/src/models/review.js

/**
 * Creates a standardized review object for a completed swap.
 * @param {string} swapId - The ID of the completed offer message (to prevent duplicate reviews)
 * @param {string} chatId - The ID of the chat where the swap happened
 * @param {string} reviewerId - The UID of the user writing the review
 * @param {string} revieweeId - The UID of the user receiving the review
 * @param {number} rating - The star rating given (e.g., 1 to 5)
 * @param {string} comment - The optional written text of the review
 * @returns {object} The formatted review payload
 */
export const createReviewModel = (swapId, chatId, reviewerId, revieweeId, rating, comment = "") => {
    return {
        swapId: swapId,
        chatId: chatId,
        reviewerId: reviewerId,
        revieweeId: revieweeId,
        rating: rating,
        comment: comment,
        createdAt: new Date().toISOString()
    };
};
