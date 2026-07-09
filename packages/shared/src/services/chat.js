// @readme/shared/src/services/chatService.js

import { getFunctions, httpsCallable } from 'firebase/functions';
import { createChatModel } from '../models/chat';
import { createOfferModel, generateVerificationCode } from '../models/offer';
import { createMessageModel } from '../models/message';
import { NEGOTIATION_STATUS } from '@readme/shared/src/constants/status';
import { DB } from './DB';

export const ChatService = {

    /**
     * Sends a standard text message.
     */
    sendTextMessage: async (chatId, currentUserId, text) => {
        const messagePayload = createMessageModel(currentUserId, text, 'text');

        await Promise.all([
            DB.create(`chats/${chatId}/messages`, messagePayload),
            DB.update('chats', chatId, { lastMessage: text })
        ]);
    },

    /**
     * Updates the status of an offer.
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
        const updatePayload = {
            'offerDetails.status': newStatus
        };

        if (newStatus === NEGOTIATION_STATUS.ACCEPTED) {
            updatePayload['offerDetails.verificationCode'] = generateVerificationCode();
            updatePayload['offerDetails.verificationDisplayerId'] = proposerId;
            updatePayload['offerDetails.verificationScannerId'] = receiverId;

            if (finalSelectedBookId) {
                updatePayload['offerDetails.finalSelectedBookId'] = finalSelectedBookId;
                updatePayload['offerDetails.finalSelectedBookImage'] = finalSelectedBookImage;
            }
        }

        await DB.update(`chats/${chatId}/messages`, messageId, updatePayload);
    },

    /**
     * Creates a new chat (if needed) and sends an initial offer.
     */
    sendInitialOffer: async (currentUserId, sellerId, targetBook, offeredBooks, location) => {
        let chatId = null;

        const existingChats = await DB.get('chats', [
            { field: 'participants', operator: 'array-contains', value: currentUserId }
        ]);

        existingChats.forEach((chatDoc) => {
            if (chatDoc.participants.includes(sellerId)) {
                chatId = chatDoc.id;
            }
        });

        const firstImage = targetBook?.imageUrl || null;
        const receiverName = targetBook?.seller?.username || "Swapper";

        if (!chatId) {
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

        const offeredBookSnapshots = offeredBooks.map(b => ({
            id: b.id,
            title: b.title || "Unknown Book",
            image: b.imageUrl || b.book?.images?.[0] || b.images?.[0] || null
        }));

        const offerPayload = createOfferModel(
            targetBook.id, 
            firstImage, 
            offeredBookSnapshots, 
            location,
            false
        );

        const messagePayload = createMessageModel(currentUserId, `Sent an offer for "${targetBook.title}"`, 'offer', offerPayload);

        await Promise.all([
            DB.create(`chats/${chatId}/messages`, messagePayload),
            DB.update('chats', chatId, { 
                lastMessage: `Swap Offer: ${targetBook.title || 'Book'}`,
                targetBookImage: firstImage 
            })
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

            const messagePayload = createMessageModel(
                currentUserId, 
                "Sent a counter proposal", 
                "offer", 
                counterOfferPayload
            );

            await Promise.all([
                DB.create(`chats/${chatId}/messages`, messagePayload),
                DB.update('chats', chatId, { lastMessage: "Counter Proposal Sent" })
            ]);

            return true;
        } catch (error) {
            console.error("Error sending counter offer:", error);
            throw error;
        }
    },

    /**
     * Uses the new streamQuery because we need to filter by participants
     */
    subscribeToActiveChats: (currentUserId, onUpdate, onError) => {
        return DB.subscribeQuery(
            'chats', 
            [
                { field: 'participants', operator: 'array-contains', value: currentUserId }
            ],
            (fetchedDocs) => {
                const fetchedChats = fetchedDocs.map(data => {
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
                });

                fetchedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                onUpdate(fetchedChats);
            }, 
            onError
        );
    },

    /**
     * Uses your original stream method, exactly as it was
     */
    subscribeToMessages: (chatId, onUpdate, onError) => {
        return DB.subscribe(`chats/${chatId}/messages`, onUpdate, onError);
    },

    verifySwapCode: async (chatId, messageId, scannedCode) => {
        try {
            const functions = getFunctions();
            functions.region = 'europe-west1'; 

            const verifyFn = httpsCallable(functions, 'verifySwapCode');

            const result = await verifyFn({ chatId, messageId, scannedCode });
            return result.data;
        } catch (error) {
            console.error("Cloud Function Verification Error:", error);
            throw error;
        }
    }
};
