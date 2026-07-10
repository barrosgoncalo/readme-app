import { useState, useEffect } from 'react';
import { ChatService } from '@readme/shared/src/services/chat';
import { ReviewService } from '@readme/shared/src/services/reviews';

export function useChatRoomData(chatId, currentUserId, targetSeller) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    const [otherUserName, setOtherUserName] = useState(
        targetSeller?.name && targetSeller.name !== "Anonymous Swapper" ? targetSeller.name : "Loading..."
    );
    const [otherUserAvatar, setOtherUserAvatar] = useState(targetSeller?.avatarUrl || null);
    const [otherUserId, setOtherUserId] = useState(targetSeller?.uid || null);
    
    const [bookImage, setBookImage] = useState(null);
    const [publicationId, setPublicationId] = useState(null);
    const [chatLocation, setChatLocation] = useState(null);
    const [hasReviewed, setHasReviewed] = useState(false);

    // --- CHAT METADATA ---
    useEffect(() => {
        if (!chatId || !currentUserId) return;

        let cancelled = false;

        ChatService.getChatMetadata(chatId, currentUserId, targetSeller)
            .then(metadata => {
                if (!metadata || cancelled) return;

                if (metadata.publicationId) setPublicationId(metadata.publicationId);
                if (metadata.bookImage) setBookImage(metadata.bookImage);
                if (metadata.chatLocation) setChatLocation(metadata.chatLocation);
                if (metadata.otherUid) setOtherUserId(metadata.otherUid);
                if (metadata.otherUserName) setOtherUserName(metadata.otherUserName);
                if (metadata.otherUserAvatar) setOtherUserAvatar(metadata.otherUserAvatar);
            })
            .catch(error => console.error("Error fetching chat metadata:", error));

        return () => { cancelled = true; };
    }, [chatId, currentUserId, targetSeller?.uid]);

    // --- MESSAGES FEED ---
    useEffect(() => {
        if (!chatId || !currentUserId) {
            setLoading(false);
            return;
        }

        const unsubscribe = ChatService.subscribeToMessagesOrdered(
            chatId,
            currentUserId,
            (fetchedMessages) => {
                setMessages(fetchedMessages);
                setLoading(false);
            },
            (error) => {
                console.error("Error loading chat room messages:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [chatId, currentUserId]);

    // --- REVIEW STATUS ---
    useEffect(() => {
        if (!chatId || !currentUserId) return;

        const unsubscribe = ReviewService.subscribeToReviewStatus(
            chatId, 
            currentUserId, 
            setHasReviewed
        );

        return () => unsubscribe();
    }, [chatId, currentUserId]);

    // Return exactly what the UI needs to render and function
    return {
        messages,
        loading,
        otherUserName,
        otherUserAvatar,
        otherUserId,
        bookImage,
        publicationId,
        chatLocation,
        hasReviewed
    };
}
