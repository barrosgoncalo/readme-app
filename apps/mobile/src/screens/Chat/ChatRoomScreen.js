import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    useColorScheme,
    Image, 
    Linking,
    Alert
} from 'react-native';
import { 
    doc, 
    updateDoc
} from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { db } from '@readme/shared/src/services/firebase'; 
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { PUBLICATION_STATUS } from '@readme/shared/src/constants/status';

import { fetchPublication } from '@readme/shared/src/services/publications';
import { ChatService } from '@readme/shared/src/services/chat';
import { ReviewService } from '@readme/shared/src/services/reviews';

import OfferMessageCard from '../../components/ui/OfferMessageCard';
import ChatBubble from '../../components/ui/ChatBubble';

export default function ChatRoomScreen({ route, navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { chatId, targetSeller } = route.params;

    const { currentUser } = useAuth();
    const currentUserId = currentUser?.uid;

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);

    const [otherUserName, setOtherUserName] = useState(
        targetSeller?.name && targetSeller.name !== "Anonymous Swapper" ? targetSeller.name : "Loading..."
    );
    const [otherUserAvatar, setOtherUserAvatar] = useState(targetSeller?.avatarUrl || null);
    const [otherUserId, setOtherUserId] = useState(targetSeller?.uid || null);
    const [bookImage, setBookImage] = useState(null);
    const [publicationId, setPublicationId] = useState(null);

    // Fallback room metadata for counter offers
    const [chatLocation, setChatLocation] = useState(null);

    const [hasReviewed, setHasReviewed] = useState(false);

    const [isFetchingBook, setIsFetchingBook] = useState(false);

    // --- CHAT METADATA ---
    useEffect(() => {
        if (!chatId || !currentUserId) return;

        let cancelled = false;

        ChatService.getChatMetadata(chatId, currentUserId, targetSeller)
            .then(metadata => {
                if (!metadata || cancelled) return;

                if (metadata.publicationId) setPublicationId(metadata.publicationId);
                setBookImage(metadata.bookImage);
                if (metadata.chatLocation) setChatLocation(metadata.chatLocation);
                if (metadata.otherUid) setOtherUserId(metadata.otherUid);
                if (metadata.otherUserName) setOtherUserName(metadata.otherUserName);
                if (metadata.otherUserAvatar) setOtherUserAvatar(metadata.otherUserAvatar);
            })
            .catch(error => console.error("Error fetching chat metadata:", error));

        return () => { cancelled = true; };
    }, [chatId, currentUserId, targetSeller?.uid]);

    // --- MESSAGES FEED (replaces the whole messages useEffect) ---
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

    // --- REVIEW STATUS (replaces the review useEffect) ---
    useEffect(() => {
        if (!chatId || !currentUserId) return;

        const unsubscribe = ReviewService.subscribeToReviewStatus(
            chatId, 
            currentUserId, 
            setHasReviewed
        );

        return () => unsubscribe();
    }, [chatId, currentUserId]);


    const handleSendMessage = async () => {
        if (!inputText.trim() || !currentUserId) return;

        const textToSend = inputText;
        setInputText('');

        try {
            await ChatService.sendTextMessage(chatId, currentUserId, textToSend);
        } catch (error) {
            console.error("Error sending message:", error);
            setInputText(textToSend); 
        }
    };

    const handleShowQRCode = (code, messageId) => {
        navigation.navigate(ROUTES.QR_DISPLAY, { 
            verificationCode: code,
            chatId: chatId,
            messageId: messageId
        });
    };

    const handleOpenScanner = (messageId) => {
        navigation.navigate(ROUTES.QR_SCANNER, {
            messageId: messageId,
            chatId: chatId
        });
    };

    const handleResolveOffer = async (
        messageId, 
        newStatus, 
        bookId = null, 
        senderIdOfOffer = null,
        finalSelectedBookId = null,
        finalSelectedBookImage = null
    ) => {
        try {
            let displayerId = senderIdOfOffer;
            let scannerId = currentUserId;

            // Update the message status in the chat room
            await ChatService.updateOfferStatus(
                chatId, 
                messageId, 
                newStatus, 
                displayerId, 
                scannerId, 
                finalSelectedBookId,
                finalSelectedBookImage
            );
            console.log("Chat offer status updated successfully.");

            // Safely attempt to reserve the books on the main feed
            if (newStatus === 'accepted') {
                const targetBookId = bookId || publicationId; 

                if (!targetBookId) {
                    console.warn("Offer accepted, but no primary book ID could be resolved from message or chat.");
                    return;
                }

                // Reserve the primary requested book
                try {
                    const publicationRef = doc(db, 'publications', targetBookId);
                    await updateDoc(publicationRef, { 
                        status: PUBLICATION_STATUS.RESERVED 
                    });
                    console.log(`Success: Primary book ${targetBookId} is now reserved.`);
                } catch (permError) {
                    console.error("Rules blocked reserving primary book:", permError);
                }

                // Reserve the offered exchange book (if this is a 2-way swap)
                if (finalSelectedBookId) {
                    try {
                        const exchangeRef = doc(db, 'publications', finalSelectedBookId);
                        await updateDoc(exchangeRef, { 
                            status: PUBLICATION_STATUS.RESERVED 
                        });
                        console.log(`Success: Exchange book ${finalSelectedBookId} is now reserved.`);
                    } catch (permError) {
                        console.error("Rules blocked reserving exchange book:", permError);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to update trade workflow context:", error);
        }
    };

    const handleCancelSwap = async (messageId, bookId, finalSelectedBookId) => {
        Alert.alert(
            "Cancel Swap",
            "Are you sure you want to cancel this agreed swap? The other user will be notified and allowed to review their experience with you.",
            [
                { text: "No, keep it", style: "cancel" },
                { 
                    text: "Yes, Cancel", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            // 1. Update status and mark WHO canceled it directly in the message document
                            const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
                            await updateDoc(messageRef, {
                                'offerDetails.status': 'cancelled',
                                'offerDetails.cancelledBy': currentUserId
                            });

                            // 2. Un-reserve the primary book
                            const targetBookId = bookId || publicationId;
                            if (targetBookId) {
                                const publicationRef = doc(db, 'publications', targetBookId);
                                await updateDoc(publicationRef, { status: PUBLICATION_STATUS.AVAILABLE });
                            }

                            // 3. Un-reserve the exchange book
                            if (finalSelectedBookId) {
                                const exchangeRef = doc(db, 'publications', finalSelectedBookId);
                                await updateDoc(exchangeRef, { status: PUBLICATION_STATUS.AVAILABLE });
                            }

                            Alert.alert("Swap Cancelled", "The swap was cancelled and books are available again.");
                        } catch (error) {
                            console.error("Error cancelling swap:", error);
                            Alert.alert("Error", "Could not cancel the swap. Please try again.");
                        }
                    } 
                }
            ]
        );
    };

    const handleOpenNavigation = (location) => {
        if (!location || !location.latitude || !location.longitude) {
            Alert.alert("Location Error", "Coordinates are unavailable for this location.");
            return;
        }

        const { latitude, longitude, title, address } = location;
        const label = encodeURIComponent(title || address || "Book Exchange Spot");

        // Deep Link URLs
        const appleMapsUrl = `maps://?q=${label}&ll=${latitude},${longitude}`;
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        const wazeUrl = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;

        Alert.alert(
            "Navigate to Spot",
            "Open this location with your preferred navigation app:",
            [
                ...(Platform.OS === 'ios' ? [{ text: "Apple Maps", onPress: () => Linking.openURL(appleMapsUrl) }] : []),
                { text: "Google Maps", onPress: () => Linking.openURL(googleMapsUrl) },
                { text: "Waze", onPress: () => Linking.openURL(wazeUrl) },
                { text: "Cancel", style: "cancel" }
            ],
            { cancelable: true }
        );
    };

    const handleOpenOptions = () => {
        Alert.alert(
            "Chat Options",
            "What would you like to do?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete Chat", 
                    style: "destructive", 
                    onPress: () => {
                        const hasActiveSwap = messages.some(msg => 
                            msg.type === 'offer' && 
                                (msg.offerDetails?.status === 'pending' || msg.offerDetails?.status === 'accepted')
                        );

                        if (hasActiveSwap) {
                            Alert.alert(
                                "Action Blocked",
                                "You have an active or pending swap in this chat! You must resolve or decline the proposal before deleting this conversation."
                            );
                        } else {
                            // Safe to proceed with confirmation
                            Alert.alert(
                                "Confirm Delete",
                                "Are you sure you want to delete this chat? It will be removed from your inbox.",
                                [
                                    { text: "Cancel", style: "cancel" },
                                    { text: "Delete", style: "destructive", onPress: handleHideChat }
                                ]
                            );
                        }
                    }
                }
            ]
        );
    };

    const handleHideChat = async () => {
        try {
            await ChatService.hideChat(chatId, currentUserId);

            Alert.alert("Success", "Chat removed from your inbox.", [
                { text: "OK", onPress: () => navigation.popToTop() }
            ]);
        } catch (error) {
            Alert.alert("Detailed Error", error.message || JSON.stringify(error));
        }
    };

    const handleBookPress = async (bookSummary) => {
        if (!bookSummary?.id) return;

        try {
            setIsFetchingBook(true);

            const fullPublicationData = await fetchPublication(bookSummary.id);

            if (fullPublicationData) {
                navigation.navigate(ROUTES.PUBLICATION_DETAILS, {
                    publication: fullPublicationData,
                    hideOfferButton: true
                });
            } else {
                console.warn("Publication no longer exists!");
                Alert.alert("Unavailable", "This book details are no longer available.");
            }
        } catch (error) {
            console.error("Failed to fetch full book details:", error);
            Alert.alert("Error", "Could not load book details. Please try again.");
        } finally {
            setIsFetchingBook(false);
        }
    };

    const renderMessageItem = ({ item, index }) => {
        const isMe = item.senderId === currentUserId;
        const isLastInGroup = index === 0 || messages[index - 1]?.senderId !== item.senderId;

        if (item.type === 'offer') {
            return (
                <View style={styles.offerCardContainer}>
                    <OfferMessageCard
                        item={item}
                        theme={theme}
                        colorScheme={colorScheme}
                        currentUserId={currentUserId}
                        chatId={chatId}
                        targetSeller={targetSeller}
                        bookImage={bookImage}
                        chatLocation={chatLocation}
                        isFetchingBook={isFetchingBook}
                        hasReviewed={hasReviewed}
                        navigation={navigation}
                        onBookPress={handleBookPress}
                        onOpenNavigation={handleOpenNavigation}
                        onResolveOffer={handleResolveOffer}
                        onShowQRCode={handleShowQRCode}
                        onOpenScanner={handleOpenScanner}
                        onCancelSwap={handleCancelSwap}
                    />
                </View>
            );
        }

        return (
            <ChatBubble
                item={item}
                isMe={isMe}
                isLastInGroup={isLastInGroup}
                theme={theme}
                colorScheme={colorScheme}
            />
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <SafeAreaView edges={['top']} style={[styles.header, { borderBottomColor: theme.borderLight }]}>
                <TouchableOpacity onPress={() => navigation.popToTop()} style={styles.backButton}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.headerProfileInfo} 
                    activeOpacity={0.7}
                    disabled={!otherUserId}
                    onPress={() => {
                        if (otherUserId) {
                            navigation.navigate(ROUTES.PUBLIC_PROFILE_SCREEN, { ownerId: otherUserId });
                        }
                    }}
                >
                    {otherUserAvatar ? (
                        <Image source={{ uri: otherUserAvatar }} style={styles.headerAvatar} />
                    ) : (
                            <View style={[styles.headerAvatarPlaceholder, { backgroundColor: theme.backgroundElement }]}>
                                <Iconify icon="lucide:user" size={20} color={theme.subtext} />
                            </View>
                        )}
                    <View style={styles.headerTextGroup}>
                        <Text style={[styles.headerName, { color: theme.textItemTitle }]}>
                            {otherUserName}
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleOpenOptions} style={styles.optionsButton}>
                    <Iconify icon="lucide:more-vertical" size={24} color={theme.textItemTitle} />
                </TouchableOpacity>
            </SafeAreaView>

            {loading ? (
                <View style={styles.centerLoading}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                    <FlatList
                        data={messages}
                        keyExtractor={(item) => item.id}
                        renderItem={renderMessageItem}
                        inverted
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />
                )}

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
                <SafeAreaView edges={['bottom']} style={[styles.inputContainer, { backgroundColor: theme.background, borderTopColor: theme.borderLight }]}>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.textItemTitle, borderColor: theme.borderLight }]}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type a message..."
                        placeholderTextColor={theme.subtext}
                        multiline
                    />
                    <TouchableOpacity 
                        style={[styles.sendButton, { backgroundColor: inputText.trim() ? (theme.primary || '#E58A1F') : theme.borderLight }]} 
                        onPress={handleSendMessage}
                        disabled={!inputText.trim()}
                    >
                        <Iconify icon="lucide:send" size={18} color={inputText.trim() ? '#FFFFFF' : theme.subtext} />
                    </TouchableOpacity>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </View>
    );
}
const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
    backButton: { padding: 4 },
    headerProfileInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerAvatar: { width: 36, height: 36, borderRadius: 18 },
    headerAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    headerTextGroup: { justifyContent: 'center' },
    headerName: { fontSize: 16, fontWeight: '700' },
    headerSubtitle: { fontSize: 12, marginTop: 2 },
    headerSpacer: { width: 40 },
    centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    listContainer: { paddingHorizontal: 16, paddingVertical: 12 },
    offerCardContainer: { width: '100%', alignItems: 'center', marginVertical: 12 },

    inputContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, alignItems: 'center', gap: 12 },
    input: { flex: 1, minHeight: 40, maxHeight: 100, borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, fontSize: 15 },
    sendButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    arrowIconContainer: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    optionsButton: { padding: 4 },
});
