// @readme/shared/src/services/chatService.js

import { collection, query, where, getDocs, addDoc, doc, updateDoc, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@readme/shared/src/services/firebase';
import { createChatModel } from '../models/chat';
import { createOfferModel, generateVerificationCode } from '../models/offer';
import { createMessageModel } from '../models/message';
import { NEGOTIATION_STATUS } from '@readme/shared/src/constants/status'

/** gf */
export const ChatService = {

    /**
     * Subscribes to real-time messages for a specific chat.
     */
    streamMessages: (chatId, onUpdate, onError) => {
        const messagesRef = collection(db, `chats/${chatId}/messages`);
        const q = query(messagesRef, orderBy('createdAt', 'desc'));

        return onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            onUpdate(list);
        }, onError);
    },

    /**
     * Sends a standard text message.
     */
    sendTextMessage: async (chatId, currentUserId, text) => {
        const messagePayload = createMessageModel(currentUserId, text, 'text');

        await Promise.all([
            addDoc(collection(db, `chats/${chatId}/messages`), messagePayload),
            updateDoc(doc(db, 'chats', chatId), {
                lastMessage: text,
                updatedAt: new Date().toISOString()
            })
        ]);
    },

    /**
     * Updates the status of an offer (e.g., 'accepted' or 'declined') 
     * and initializes verification data and chosen book if accepted.
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
        const messageRef = doc(db, `chats/${chatId}/messages`, messageId);
        
        const updatePayload = {
            'offerDetails.status': newStatus
        };

        if (newStatus === NEGOTIATION_STATUS.ACCEPTED) {
            updatePayload['offerDetails.verificationCode'] = generateVerificationCode();
            updatePayload['offerDetails.verificationDisplayerId'] = proposerId;
            updatePayload['offerDetails.verificationScannerId'] = receiverId;
            
            // Save the receiver's specific choice
            if (finalSelectedBookId) {
                updatePayload['offerDetails.finalSelectedBookId'] = finalSelectedBookId;
                updatePayload['offerDetails.finalSelectedBookImage'] = finalSelectedBookImage;
            }
        }

        await updateDoc(messageRef, updatePayload);
    },

    /**
     * Creates a new chat (if needed) and sends an initial offer.
     */
    sendInitialOffer: async (currentUserId, sellerId, targetBook, offeredBooks, location) => {
        const chatsRef = collection(db, 'chats');
        let chatId = null;

        const q = query(chatsRef, where('participants', 'array-contains', currentUserId));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            if (doc.data().participants.includes(sellerId)) {
                chatId = doc.id;
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
            const newChatRef = await addDoc(chatsRef, newChatData);
            chatId = newChatRef.id;
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
            addDoc(collection(db, `chats/${chatId}/messages`), messagePayload),
            updateDoc(doc(db, 'chats', chatId), {
                lastMessage: `Swap Offer: ${targetBook.title || 'Book'}`,
                targetBookImage: firstImage,
                updatedAt: new Date().toISOString()
            })
        ]);

        return chatId;
    },

    /**
     * Sends a counter-proposal based on an original offer.
     */
    sendCounterOffer: async (chatId, originalMessageId, currentUserId, originalOffer, newLocation) => {
        try {
            // 1. Update the old message to 'countered'
            const originalMessageRef = doc(db, 'chats', chatId, 'messages', originalMessageId);
            await updateDoc(originalMessageRef, {
                'offerDetails.status': 'countered'
            });

            // Reuse the original target and original offered snapshots, just swapping the location.
            const counterOfferPayload = createOfferModel(
                originalOffer.targetBookId,
                originalOffer.targetBookImage,
                originalOffer.offeredBooks, // Forward the snapshots array perfectly
                newLocation || originalOffer.location || {},
                true // isCounter = true
            );

            // 3. Create the new message payload
            const messagePayload = createMessageModel(
                currentUserId, 
                "Sent a counter proposal", 
                "offer", 
                counterOfferPayload
            );

            // 4. Save the new message and update the root chat
            await Promise.all([
                addDoc(collection(db, `chats/${chatId}/messages`), messagePayload),
                updateDoc(doc(db, 'chats', chatId), {
                    lastMessage: "Counter Proposal Sent",
                    updatedAt: new Date().toISOString()
                })
            ]);

            return true;
        } catch (error) {
            console.error("Error sending counter offer:", error);
            throw error;
        }
    },
};
