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

        if (!chatId) {
            const newChatData = createChatModel([currentUserId, sellerId], `Offered swap for ${targetBook.title}`);
            const newChatRef = await addDoc(chatsRef, newChatData);
            chatId = newChatRef.id;
        }

        const offerPayload = createOfferModel(targetBook.id, offeredBooks.map(b => b.id), location);
        const messagePayload = createMessageModel(currentUserId, `Sent an offer for "${targetBook.title}"`, 'offer', offerPayload);

        const firstImage = targetBook?.book?.images?.[0] || targetBook?.images?.[0] || null;

        await Promise.all([
            addDoc(collection(db, `chats/${chatId}/messages`), messagePayload),
            updateDoc(doc(db, 'chats', chatId), {
                lastMessage: `Swap Offer: ${targetBook.title || 'Book'}`,
                targetBookImage: firstImage, // <--- Saves the image directly to the chat
                buyerId: currentUserId,      // <--- Saves who initiated to fix the arrows!
                updatedAt: new Date().toISOString()
            })
        ]);

        return chatId;
    }
};
