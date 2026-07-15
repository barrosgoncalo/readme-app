/**
 * Creates a standardized chat thread object for a swap.
 * @param {Array<string>} participants - Array of user UIDs involved in the chat
 * @param {string} proposerId - UID of the user initiating the swap/chat
 * @param {string} receiverId - UID of the user who owns the book being requested
 * @param {Object} proposerInfo - { name, avatarUrl } for the proposer
 * @param {Object} receiverInfo - { name, avatarUrl } for the receiver
 * @param {string} targetBookId - ID of the book being requested
 * @param {string} targetBookImage - Image URL of the book being requested
 * @param {string} lastMessage - A preview of the latest message
 */
export const createChatModel = (
    participants,
    proposerId,
    receiverId,
    proposerInfo,
    receiverInfo,
    targetBookId,
    targetBookImage,
    lastMessage = "Started a new conversation"
) => {
    return {
        participants: participants,
        proposerId: proposerId,
        receiverId: receiverId,

        receiverName: receiverInfo?.name || "Swapper",
        receiverAvatar: receiverInfo?.avatarUrl || null,
        proposerName: proposerInfo?.name || "Swapper",
        proposerAvatar: proposerInfo?.avatarUrl || null,

        // --- UI CACHE FIELDS (For the Inbox Screen) ---
        targetBookId: targetBookId || null,
        targetBookImage: targetBookImage || null,

        lastMessage: lastMessage,
        status: "active",
        createdAt: null,
        updatedAt: null,
        hiddenFor: []
    };
};
