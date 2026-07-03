// @readme/shared/src/models/message.js

/**
 * Creates a standardized message object for a chat thread.
 * @param {string} senderId - The UID of the user sending the message
 * @param {string} text - The actual text or preview text of the message
 * @param {string} type - 'text', 'offer', 'image', etc.
 * @param {object|null} offerPayload - A pre-formatted offer object (from createOfferModel)
 * @returns {object} The formatted data payload for Firestore
 */
export const createMessageModel = (senderId, text, type = "text", offerPayload = null) => {
    return {
        senderId: senderId,
        text: text.trim(),
        type: type,
        // If an offer payload is provided, attach it; otherwise, omit it.
        ...(type === 'offer' && offerPayload ? { offerDetails: offerPayload } : {}),
        
        // -- Timestamps & Status --
        createdAt: new Date().toISOString(),
        read: false 
    };
};
