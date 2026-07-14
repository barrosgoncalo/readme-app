export const generateVerificationCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * Creates a standardized swap offer object.
 * @param {string} targetBookId - The ID of the book being requested
 * @param {string} targetBookImage - The cover image URL of the target book (SNAPSHOT)
 * @param {Array<object>} offeredBooks - Array of objects: [{ id, image, title }] (SNAPSHOTS)
 * @param {object} locationData - Raw location object from your map selection
 * @param {boolean} isCounter - Flags if this is a counter-offer
 * @returns {object} The formatted offer payload
 */
export const createOfferModel = (
    targetBookId, 
    targetBookImage, 
    offeredBooks = [], 
    locationData = {},
    isCounter = false
) => {

    const isSingleBook = offeredBooks.length === 1;

    return {
        targetBookId: targetBookId,
        targetBookImage: targetBookImage || null,
        
        offeredBooks: offeredBooks,
        
        finalSelectedBookId: isSingleBook ? offeredBooks[0].id : null,
        finalSelectedBookImage: isSingleBook ? offeredBooks[0].image : null,

        // Context
        isCounter: isCounter,
        status: 'pending',
        
        location: {
            id: locationData.id || null,
            title: locationData.title || "Unknown Location",
            address: locationData.address || "",
            latitude: locationData.latitude ?? null,
            longitude: locationData.longitude ?? null,
        },
        
        // Handshake data
        verificationCode: null,
        verificationScannerId: null,
        verificationDisplayerId: null,
        verifiedAt: null,
        
        createdAt: new Date().toISOString()
    };
};
