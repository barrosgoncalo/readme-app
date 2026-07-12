import { arrayUnion } from 'firebase/firestore';
import { createChatModel } from '../models/chat';
import { createOfferModel, generateVerificationCode } from '../models/offer';
import { createMessageModel } from '../models/message';
import { NEGOTIATION_STATUS } from '@readme/shared/src/constants/status';
import { DB } from './DB';
import { CloudFunctions } from './cloudFunctions';

// ==========================================
// PRIVATE AUXILIARY HELPERS
// ==========================================

/**
 * Searches the DB to see if a chat already exists between two users.
 */
const _findExistingChatId = async (currentUserId, sellerId) => {
    const existingChats = await DB.get('chats', [
        { field: 'participants', operator: 'array-contains', value: currentUserId }
    ]);

    const chat = existingChats.find(chatDoc => chatDoc.participants.includes(sellerId));
    return chat ? chat.id : null;
};

/**
 * Formats an array of raw books into the standard snapshot format for offers.
 */
const _formatOfferedBooks = (offeredBooks) => {
    return offeredBooks.map(b => ({
        id: b.id,
        title: b.title || "Unknown Book",
        image: b.imageUrl || b.book?.images?.[0] || b.images?.[0] || null
    }));
};

/**
 * Generates the specific payloads needed when an offer is Accepted.
 */
const _buildAcceptedOfferPayloads = (proposerId, receiverId, finalBookId, finalBookImage) => {
    const msgPayload = {
        'offerDetails.verificationCode': generateVerificationCode(),
        'offerDetails.verificationDisplayerId': proposerId,
        'offerDetails.verificationScannerId': receiverId,
    };
    const chatPayload = {};

    if (finalBookId) {
        msgPayload['offerDetails.finalSelectedBookId'] = finalBookId;
        msgPayload['offerDetails.finalSelectedBookImage'] = finalBookImage;
        chatPayload.targetBookImage = finalBookImage;
    }

    return { msgPayload, chatPayload };
};

/**
 * Formats a raw database chat document into the frontend Inbox Preview model.
 */
const _mapChatToInboxPreview = (data, currentUserId) => {
    const isOutgoing = data.proposerId === currentUserId;
    const otherParticipantUid = data.participants?.find(uid => uid !== currentUserId);

    return {
        id: data.id,
        imageUrl: data.targetBookImage || 'https://via.placeholder.com/150',
        status: isOutgoing ? 'giving' : 'receiving', 
        targetSeller: {
            uid: otherParticipantUid,
            name: isOutgoing 
                ? (data.receiverName || 'Swapper') 
                : (data.proposerName || 'Swapper'),
            avatarUrl: isOutgoing 
                ? (data.receiverAvatar || null) 
                : (data.proposerAvatar || null)
        },
        updatedAt: data.updatedAt || data.createdAt
    };
};

/**
 * Resolves the other participant's identity for a chat, using piped-in
 * targetSeller data when available and falling back to a user doc fetch.
 */
const _resolveOtherUser = async (chatData, currentUserId, targetSeller) => {
    let otherUid = targetSeller?.uid;

    if (!otherUid || otherUid === currentUserId) {
        otherUid = chatData.participants?.find(uid => uid !== currentUserId);
    }

    const hasPipedData = targetSeller?.name && targetSeller.name !== "Anonymous Swapper" && targetSeller.avatarUrl;

    if (otherUid && !hasPipedData) {
        const userData = await DB.get('users', otherUid);
        if (userData) {
            return {
                otherUid,
                otherUserName: userData.username || userData.name || "Swapper",
                otherUserAvatar: userData.photoURL || null,
            };
        }
    }

    return { otherUid: otherUid || null, otherUserName: null, otherUserAvatar: null };
};


// ==========================================
// EXPORTED SERVICE
// ==========================================

export const ChatService = {

    /**
     * Sends a standard text message.
     */
    sendTextMessage: async (chatId, currentUserId, text) => {
        const messagePayload = createMessageModel(currentUserId, text, 'text');

        await Promise.all([
            DB.create(`chats/${chatId}/messages`, messagePayload),
            DB.update('chats', chatId, { 
                lastMessage: text,
                hiddenFor: []
            }, true)
        ]);
    },

    /**
     * Hides a chat from the user's inbox.
     */
    hideChat: async (chatId, currentId) => {
        try {
            await DB.update('chats', chatId, {
                hiddenFor: arrayUnion(currentId)
            }, true);
            return { success: true };
        } catch(error) {
            console.error("Error hiding chat:", error);
            throw error;
        }
    },

    /**
     * Updates the status of an offer and refreshes the parent chat metadata.
     */
    updateOfferStatus: async (
        chatId, 
        messageId, 
        newStatus, 
        proposerId = null, 
        receiverId = null,
        finalSelectedBookId = null,
        finalSelectedBookImage = null
    ) => {
        let messageUpdatePayload = { 'offerDetails.status': newStatus };
        let chatParentPayload = { hiddenFor: [] };

        if (newStatus === NEGOTIATION_STATUS.ACCEPTED) {
            const { msgPayload, chatPayload } = _buildAcceptedOfferPayloads(
                proposerId, receiverId, finalSelectedBookId, finalSelectedBookImage
            );
            
            messageUpdatePayload = { ...messageUpdatePayload, ...msgPayload };
            chatParentPayload = { ...chatParentPayload, ...chatPayload };
        }

        await Promise.all([
            DB.update(`chats/${chatId}/messages`, messageId, messageUpdatePayload, true),
            DB.update('chats', chatId, chatParentPayload, true)
        ]);
    },

    /**
     * Creates a new chat (if needed) and sends an initial offer.
     */
    sendInitialOffer: async (currentUserId, sellerId, targetBook, offeredBooks, location) => {
        let chatId = await _findExistingChatId(currentUserId, sellerId);

        const firstImage = targetBook?.imageUrl || null;

        if (!chatId) {
            const receiverName = targetBook?.seller?.username || "Swapper";
            const newChatData = createChatModel(
                [currentUserId, sellerId],
                currentUserId,
                sellerId,
                receiverName,
                firstImage,
                `Offered swap for ${targetBook.title}`
            );
            chatId = await DB.create('chats', newChatData);
        }

        const offeredBookSnapshots = _formatOfferedBooks(offeredBooks);
        const offerPayload = createOfferModel(targetBook.id, firstImage, offeredBookSnapshots, location, false);
        const messagePayload = createMessageModel(currentUserId, `Sent an offer for "${targetBook.title}"`, 'offer', offerPayload);

        await Promise.all([
            DB.create(`chats/${chatId}/messages`, messagePayload),
            DB.update('chats', chatId, { 
                lastMessage: `Swap Offer: ${targetBook.title || 'Book'}`,
                targetBookImage: firstImage,
                hiddenFor: []
            }, true)
        ]);

        return chatId;
    },

    /**
     * Sends a counter-proposal based on an original offer.
     */
    sendCounterOffer: async (chatId, originalMessageId, currentUserId, originalOffer, newLocation, selectedBookId = null, selectedBookImage = null) => {
        try {
            await DB.update(`chats/${chatId}/messages`, originalMessageId, {
                'offerDetails.status': 'countered'
            });

            const counterOfferPayload = createOfferModel(
                originalOffer.targetBookId,
                originalOffer.targetBookImage,
                originalOffer.offeredBooks,
                newLocation || originalOffer.location || {},
                true
            );

            if (selectedBookId) {
                counterOfferPayload.selectedBookId = selectedBookId;
                counterOfferPayload.selectedBookImage = selectedBookImage;
            }

            const messagePayload = createMessageModel(currentUserId, "Sent a counter proposal", "offer", counterOfferPayload);

            await Promise.all([
                DB.create(`chats/${chatId}/messages`, messagePayload),
                DB.update('chats', chatId, {
                    lastMessage: "Counter Proposal Sent",
                    hiddenFor: []
                }, true)
            ]);

            return true;
        } catch (error) {
            console.error("Error sending counter offer:", error);
            throw error;
        }
    },

    /**
     * Subscribes to the active chat inbox list.
     */
    subscribeToActiveChats: (currentUserId, onUpdate, onError) => {
        return DB.subscribeQuery(
            'chats', 
            [ { field: 'participants', operator: 'array-contains', value: currentUserId } ],
            (fetchedDocs) => {
                const fetchedChats = fetchedDocs
                    .filter(data => !(data?.hiddenFor || []).includes(currentUserId)) 
                    .map(data => _mapChatToInboxPreview(data, currentUserId));

                fetchedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                onUpdate(fetchedChats);
            }, 
            onError
        );
    },

    /**
     * Subscribes to a single message document (used for swap verification status).
     */
    subscribeToMessage: (chatId, messageId, onUpdate, onError) => {
        return DB.subscribeDoc(`chats/${chatId}/messages`, messageId, onUpdate, onError);
    },

    /**
     * Subscribes to a specific chat's messages.
     */
    subscribeToMessages: (chatId, onUpdate, onError) => {
        return DB.subscribe(`chats/${chatId}/messages`, onUpdate, onError);
    },

    /**
     * Fetches one-time chat metadata: cached book image/location, and
     * resolves the other participant's identity (using piped data if present).
     * Returns null if the chat doc doesn't exist.
     */
    getChatMetadata: async (chatId, currentUserId, targetSeller) => {
        const chatData = await DB.get('chats', chatId);
        if (!chatData) return null;

        const { otherUid, otherUserName, otherUserAvatar } = await _resolveOtherUser(
            chatData, currentUserId, targetSeller
        );

        return {
            publicationId: chatData.targetBookId || null,
            bookImage: chatData.targetBookImage || null,
            chatLocation: chatData.location || null,
            otherUid,
            otherUserName,
            otherUserAvatar,
        };
    },

    /**
     * Subscribes to a chat's messages ordered newest-first, and marks any
     * incoming (not-yet-read) messages as read. Returns the unsubscribe fn.
     */
    subscribeToMessagesOrdered: (chatId, currentUserId, onUpdate, onError) => {
        return DB.subscribeQuery(
            `chats/${chatId}/messages`,
            [],
            (fetchedDocs) => {
                const getTime = (m) => m.createdAt?.toMillis?.() ?? m.clientTimestamp ?? 0;
                const sorted = [...fetchedDocs].sort((a, b) => getTime(b) - getTime(a));
                onUpdate(sorted);
                ChatService.markMessagesAsRead(chatId, sorted, currentUserId);
            },
            onError
        );
    },

    /**
     * Marks all messages from the other user as read.
     */
    markMessagesAsRead: async (chatId, messages, currentUserId) => {
        const unreadFromOther = messages.filter(
            msg => msg.senderId !== currentUserId && !msg.read
        );

        await Promise.all(
            unreadFromOther.map(msg =>
                DB.update(`chats/${chatId}/messages`, msg.id, { read: true }, true).catch(error => {
                    console.error("Error updating read status:", error);
                })
            )
        );
    },

    /**
     * Calls the verifySwapCode Cloud Function to validate a scanned code
     * and mark the swap as completed.
     */
    verifySwapCode: (chatId, messageId, scannedCode) =>
        CloudFunctions.call('verifySwapCode', { chatId, messageId, scannedCode }),
};
