// @readme/shared/src/models/offer.js

/**
 * Creates a standardized swap offer object.
 * @param {string} targetBookId - The ID of the book being requested
 * @param {Array<string>} offeredBookIds - Array of book IDs being offered in exchange
 * @param {object} locationData - Raw location object from your map selection
 * @returns {object} The formatted offer payload
 */
export const createOfferModel = (targetBookId, targetBookImage, offeredBookIds = [], locationData = {}) => {
    return {
        targetBookId: targetBookId,
        targetBookImage: targetBookImage || null,
        offeredBookIds: offeredBookIds,
        location: {
            id: locationData.id || null,
            title: locationData.title || "Unknown Location",
            address: locationData.address || ""
        },
        status: 'pending',
        createdAt: new Date().toISOString()
    };
};
