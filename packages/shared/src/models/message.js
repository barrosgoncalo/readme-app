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
        senderId,
        text: text.trim(),
        type,
        ...(type === 'offer' && offerPayload ? { offerDetails: offerPayload } : {}),
        clientTimestamp: Date.now(),
        read: false
    };
};
