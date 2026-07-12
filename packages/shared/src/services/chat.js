// @readme/shared/src/services/chatService.js
import {
    addDoc, collection, doc, getDocs, getDoc, onSnapshot,
    orderBy, query, updateDoc, where, writeBatch, arrayRemove
} from 'firebase/firestore';
import {db} from '@readme/shared/src/services/firebase';
import {createChatModel} from '../models/chat';
import {createOfferModel, generateVerificationCode} from '../models/offer';
import {createMessageModel} from '../models/message';
import {PUBLICATION_STATUS, NEGOTIATION_STATUS} from '@readme/shared/src/constants/status';

export const ChatService = {

    /**
     * Subscribes to real-time messages for a specific chat.
     */
    streamMessages: (chatId, onUpdate, onError) => {
        const messagesRef = collection(db, `chats/${chatId}/messages`);
        const q = query(messagesRef, orderBy('createdAt', 'desc'));

        return onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
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

        try {
            const messageSnap = await getDoc(messageRef);
            if (messageSnap.exists()) {
                const offer = messageSnap.data().offerDetails;
                const pubId = offer?.originalTargetId || offer?.targetBookId;

                if (pubId) {
                    let newPubStatus = null;
                    if (newStatus === NEGOTIATION_STATUS.ACCEPTED)
                        newPubStatus = PUBLICATION_STATUS.RESERVED;
                    else if (newStatus === NEGOTIATION_STATUS.DECLINED || newStatus === 'withdrawn')
                        newPubStatus = PUBLICATION_STATUS.AVAILABLE;

                    if (newPubStatus) {
                        const pubRef = doc(db, 'publications', pubId);
                        const pubSnap = await getDoc(pubRef); // Verifica se realmente é uma publicação
                        if (pubSnap.exists())
                            await updateDoc(pubRef, {status: newPubStatus});
                    }
                }
            }
        } catch (err) {
            console.error("Error updating publication status:", err);
        }
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

        const firstImage = targetBook?.imageUrl || targetBook?.book?.images?.[0] || targetBook?.images?.[0] || null;
        const receiverName = targetBook?.seller?.name || targetBook?.sellerName || "Swapper";

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

        const offerPayload = createOfferModel(
            targetBook.id,
            firstImage,
            offeredBooks.map(b => b.id),
            location
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

    sendCounterOffer: async (chatId, originalMessageId, currentUserId, originalOffer, selectedBookId, newLocation) => {
        try {
            const originalMessageRef = doc(db, 'chats', chatId, 'messages', originalMessageId);
            await updateDoc(originalMessageRef, {
                'offerDetails.status': 'countered'
            });

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

            const messagePayload = createMessageModel(
                currentUserId,
                "Sent a counter proposal",
                "offer",
                counterOfferPayload
            );

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
            const list = snap.docs.map(d => ({id: d.id, ...d.data()}));
            list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            onUpdate(list);
        }, onError);
    },

    /**
     * Mark a swap as completed with verification timestamp.
     */
    completeSwap: async (chatId, messageId) => {
            const messageRef = doc(db, `chats/${chatId}/messages`, messageId);

            try {
                const messageSnap = await getDoc(messageRef);
                if (messageSnap.exists()) {
                    const offer = messageSnap.data().offerDetails;
                    const pubId = offer?.originalTargetId || offer?.targetBookId;

                    if (pubId) {
                        const pubRef = doc(db, 'publications', pubId);
                        const pubSnap = await getDoc(pubRef);

                        if (pubSnap.exists()) {
                            await updateDoc(pubRef, { status: PUBLICATION_STATUS.SWAPPED });

                            const usersRef = collection(db, 'users');
                            const qFavs = query(usersRef, where('favoriteBooks', 'array-contains', pubId));
                            const favsSnap = await getDocs(qFavs);

                            if (!favsSnap.empty) {
                                const batch = writeBatch(db);
                                favsSnap.forEach((userDoc) => {
                                    batch.update(userDoc.ref, {
                                        favoriteBooks: arrayRemove(pubId)
                                    });
                                });
                                await batch.commit();
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Error updating publication and cleaning favorites:", err);
            }

            await updateDoc(messageRef, {
                'offerDetails.status': 'completed',
                'offerDetails.verifiedAt': new Date().toISOString(),
            });
        },

    /**
     * Acionada quando o User B escolhe um livro da lista enviada pelo User A.
     */
    chooseBookFromOffer: async (chatId, originalMessage, chosenBook, currentUserId, otherUserId, realOfferedId, offeredTitle) => {
        await ChatService.updateOfferStatus(chatId, originalMessage.id, 'countered', originalMessage.senderId, currentUserId);
        const offer = originalMessage.offerDetails;

        const newMessagePayload = {
            targetBookId: chosenBook.id,
            targetBookImage: chosenBook.coverUrl || null,
            offeredBookIds: offer.targetBookId ? [offer.targetBookId] : [],
            location: offer.location || null,
            status: 'pending',
            savedRealOfferedId: realOfferedId || null,
            savedOfferedTitle: offeredTitle || null,

            isSelectionFrom: originalMessage.id,
            originalOfferedIds: offer.offeredBookIds,
            originalTargetId: offer.targetBookId,
            originalTargetImage: offer.targetBookImage
        };

        const messagePayload = createMessageModel(currentUserId, `Selected "${chosenBook.title
        || 'a book'}" from your offer`, 'offer', newMessagePayload);

        await Promise.all([
            addDoc(collection(db, `chats/${chatId}/messages`), messagePayload),
            updateDoc(doc(db, 'chats', chatId), {
                lastMessage: 'Chose a book from the list',
                updatedAt: new Date().toISOString()
            })
        ]);
    },

    /**
     * Acionada quando o User A rejeita a escolha (Decline) e ainda sobram
     * livros da lista original para continuar a negociação.
     */
    declineOfferAndReofferRemaining: async (chatId, messageToDecline, currentUserId, otherUserId) => {
        await ChatService.updateOfferStatus(chatId, messageToDecline.id, 'declined', messageToDecline.senderId, currentUserId);

        const offer = messageToDecline.offerDetails;

        if (offer.isSelectionFrom && offer.originalOfferedIds) {
            const remainingIds = offer.originalOfferedIds.filter(id => id !== offer.targetBookId);

            if (remainingIds.length > 0) {
                const newOfferPayload = {
                    targetBookId: offer.originalTargetId,
                    targetBookImage: offer.originalTargetImage || null,
                    offeredBookIds: remainingIds,
                    location: offer.location || null,
                    status: 'pending'
                };

                const messagePayload = createMessageModel(currentUserId,
                    'Declined and offered remaining books', 'offer', newOfferPayload);

                await Promise.all([
                    addDoc(collection(db, `chats/${chatId}/messages`), messagePayload),
                    updateDoc(doc(db, 'chats', chatId), {
                        lastMessage: 'Declined and offered remaining books',
                        updatedAt: new Date().toISOString()
                    })
                ]);
            }
        }
    }
};