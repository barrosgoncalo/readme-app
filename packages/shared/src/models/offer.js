// @readme/shared/src/models/offer.js

export const generateVerificationCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * Creates a standardized swap offer object.
 * @param {string} targetBookId - The ID of the book being requested
 * @param {string} targetBookImage - The cover image URL of the target book
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
            address: locationData.address || "",
            lat: locationData.lat ?? locationData.latitude ?? null,
            lon: locationData.lon ?? locationData.longitude ?? null
        },
        status: 'pending', // Will progress to 'accepted', then 'completed'
        
        verificationCode: null,
        verificationScannerId: null,
        verificationDisplayerId: null,
        verifiedAt: null,
        
        createdAt: new Date().toISOString()
    };
};

