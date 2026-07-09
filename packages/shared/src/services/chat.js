// @readme/shared/src/services/chatService.js

import { collection, query, where, getDocs, addDoc, doc, updateDoc, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@readme/shared/src/services/firebase';
import { createChatModel } from '../models/chat';
import { createOfferModel, generateVerificationCode } from '../models/offer';
import { createMessageModel } from '../models/message';
import { NEGOTIATION_STATUS } from '@readme/shared/src/constants/status'
import { toMillis } from '../utils/timestamp';

export const ChatService = {

    /**
     * Subscribes to real-time messages for a specific chat.
     */
    streamMessages: (chatId, onUpdate, onError) => {
        const messagesRef = collection(db, `chats/${chatId}/messages`);
        const q = query(messagesRef, orderBy('createdAt', 'desc'));

        return onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
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
     * and initializes verification data if accepted.
     */
    updateOfferStatus: async (chatId, messageId, newStatus, proposerId = null, receiverId = null) => {
        const messageRef = doc(db, `chats/${chatId}/messages`, messageId);
        
        const updatePayload = {
            'offerDetails.status': newStatus
        };

        if (newStatus === NEGOTIATION_STATUS.ACCEPTED) {
            updatePayload['offerDetails.verificationCode'] = generateVerificationCode();
            updatePayload['offerDetails.verificationDisplayerId'] = proposerId;
            updatePayload['offerDetails.verificationScannerId'] = receiverId;
        }

        await updateDoc(messageRef, updatePayload);
    },

    /**
     * Creates a new chat (if needed) and sends an initial offer.
     * Returns the chatId so the UI can navigate to it.
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

        // 1. Extract the UI data safely
        const firstImage = targetBook?.imageUrl || targetBook?.book?.images?.[0] || targetBook?.images?.[0] || null;
        const receiverName = targetBook?.seller?.name || targetBook?.sellerName || "Swapper";

        if (!chatId) {
            // 2. Pass all 6 arguments exactly as createChatModel expects them
            const newChatData = createChatModel(
                [currentUserId, sellerId],              // participants
                currentUserId,                          // proposerId
                sellerId,                               // receiverId
                receiverName,                           // receiverName
                firstImage,                             // targetBookImage
                `Offered swap for ${targetBook.title}`  // lastMessage
            );
            const newChatRef = await addDoc(chatsRef, newChatData);
            chatId = newChatRef.id;
        }

        // 3. FIXED: Pass `firstImage` as the 2nd argument so the order matches your model!
        const offerPayload = createOfferModel(
            targetBook.id, 
            firstImage, // <-- Inserted here!
            offeredBooks.map(b => b.id), 
            location
        );

        const messagePayload = createMessageModel(currentUserId, `Sent an offer for "${targetBook.title}"`, 'offer', offerPayload);

        await Promise.all([
            addDoc(collection(db, `chats/${chatId}/messages`), messagePayload),
            updateDoc(doc(db, 'chats', chatId), {
                lastMessage: `Swap Offer: ${targetBook.title || 'Book'}`,
                targetBookImage: firstImage, // <-- Added this! Ensures reused chats update their cover image for the Explore Screen
                updatedAt: new Date().toISOString()
            })
        ]);

        return chatId;
    },

    sendCounterOffer: async (chatId, originalMessageId, currentUserId, originalOffer, selectedBookId, newLocation) => {
        try {
            // 1. Update the old message to 'countered'
            const originalMessageRef = doc(db, 'chats', chatId, 'messages', originalMessageId);
            await updateDoc(originalMessageRef, {
                'offerDetails.status': 'countered'
            });

            // 2. Build the Counter-Offer Payload
            const counterOfferPayload = {
                targetBookId: originalOffer.targetBookId,
                targetBookImage: originalOffer.targetBookImage || null,
                offeredBookIds: originalOffer.offeredBookIds, 
                selectedBookId: selectedBookId, 
                selectedBookImage: originalOffer.selectedBookImage || null,
                location: newLocation || originalOffer.location || {},
                isCounter: true,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

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

    /**
     * Streams all chats where the user participates, newest first.
     */
    streamUserChats: (uid, onUpdate, onError) => {
        const q = query(collection(db, 'chats'), where('participants', 'array-contains', uid));
        return onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
            onUpdate(list);
        }, onError);
    },

    /**
     * Mark a swap as completed with verification timestamp.
     */
    completeSwap: async (chatId, messageId) => {
        await updateDoc(doc(db, `chats/${chatId}/messages`, messageId), {
            'offerDetails.status': 'completed',
            'offerDetails.verifiedAt': new Date().toISOString(),
        });
    },
};
