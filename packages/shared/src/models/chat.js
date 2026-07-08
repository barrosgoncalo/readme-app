// @readme/shared/src/models/chat.js

/**
 * Creates a standardized chat thread object for a swap.
 * @param {Array<string>} participants - Array of user UIDs involved in the chat
 * @param {string} proposerId - UID of the user initiating the swap/chat
 * @param {string} receiverId - UID of the user who owns the book being requested
 * @param {string} receiverName - Display name of the receiver for the UI
 * @param {string} targetBookImage - Image URL of the book being requested
 * @param {string} lastMessage - A preview of the latest message
 */
export const createChatModel = (
    participants, 
    proposerId, 
    receiverId, 
    receiverName, 
    targetBookId,      // Keep this parameter
    targetBookImage,   // Keep this parameter
    lastMessage = "Started a new conversation"
) => {
    return {
        participants: participants,
        proposerId: proposerId,
        receiverId: receiverId,
        receiverName: receiverName,
        
        // --- UI CACHE FIELDS (For the Inbox Screen) ---
        targetBookId: targetBookId || null, 
        targetBookImage: targetBookImage || null, 
        
        lastMessage: lastMessage,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
};
