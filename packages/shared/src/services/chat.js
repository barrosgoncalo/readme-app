// @readme/shared/src/services/chatService.js

import { collection, query, where, getDocs, addDoc, doc, updateDoc, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@readme/shared/src/services/firebase';
import { createChatModel } from '../models/chat';
import { createOfferModel } from '../models/offer';
import { createMessageModel } from '../models/message';

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
     * Updates the status of an offer (e.g., 'accepted' or 'declined').
     */
    updateOfferStatus: async (chatId, messageId, newStatus) => {
        await updateDoc(doc(db, `chats/${chatId}/messages`, messageId), {
            'offerDetails.status': newStatus
        });
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

    sendCounterOffer: async (chatId, originalMessageId, currentUserId, originalOffer, selectedBookId) => {
        try {
            // 1. Update the old message to 'countered' so it locks in the UI
            const originalMessageRef = doc(db, 'chats', chatId, 'messages', originalMessageId);
            await updateDoc(originalMessageRef, {
                'offerDetails.status': 'countered'
            });

            // 2. Build the Counter-Offer Payload
            const counterOfferPayload = {
                targetBookId: originalOffer.targetBookId,
                targetBookImage: originalOffer.targetBookImage || null,
                offeredBookIds: originalOffer.offeredBookIds, 
                selectedBookId: selectedBookId, // The specific book they chose!
                location: originalOffer.location || {},
                isCounter: true,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            // 3. Create the new message payload
            // Assuming you have createMessageModel imported in your service
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
