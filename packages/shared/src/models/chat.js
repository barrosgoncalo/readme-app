// @readme/shared/src/models/chat.js

/**
 * Creates a standardized chat thread object.
 * @param {Array<string>} participants - Array of user UIDs involved in the chat (e.g., [buyer.uid, seller.uid])
 * @param {string} lastMessage - A preview of the latest message for the inbox view
 * @returns {object} The formatted data payload for Firestore
 */
export const createChatModel = (participants, lastMessage = "Started a new conversation") => {
    return {
        participants: participants, 
        lastMessage: lastMessage,
        
        status: "active",
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
};
