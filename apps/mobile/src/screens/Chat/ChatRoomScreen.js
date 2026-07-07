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
    Image, Linking,
    Alert
} from 'react-native';
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot, 
    doc, 
    getDoc,
    updateDoc
} from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { db } from '@readme/shared/src/services/firebase'; 
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { ChatService } from '@readme/shared/src/services/chat';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes'
import { PUBLICATION_STATUS } from '@readme/shared/src/constants/status';

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

    const [hasReviewed, setHasReviewed] = useState(false);

    // --- SAFE METADATA FETCH LAYER ---
    useEffect(() => {
        if (!chatId || !currentUserId) return;

        const fetchChatMetadata = async () => {
            try {
                const chatRef = doc(db, 'chats', chatId);
                const chatSnap = await getDoc(chatRef);

                if (chatSnap.exists()) {
                    const chatData = chatSnap.data();

                    const pubId = chatData.publicationId ||
                        chatData.targetBook?.id ||
                        chatData.targetBook?.publicationData?.id;

                    if (pubId) setPublicationId(pubId);

                    const resolvedImg = chatData.targetBook?.imageUrl || 
                        chatData.targetBook?.images?.[0] || 
                        chatData.targetBook?.book?.images?.[0] || 
                        chatData.targetBookImage || 
                        null;
                    setBookImage(resolvedImg);

                    const otherUid = targetSeller?.uid || chatData.participants?.find(uid => uid !== currentUserId);

                    if (otherUid) setOtherUserId(otherUid);

                    const hasPipedData = targetSeller?.name && targetSeller.name !== "Anonymous Swapper" && targetSeller.avatarUrl;

                    if (otherUid && !hasPipedData) {
                        const userRef = doc(db, 'users', otherUid);
                        const userSnap = await getDoc(userRef);

                        if (userSnap.exists()) {
                            const userData = userSnap.data();
                            setOtherUserName(userData.username || userData.name || "Swapper");
                            setOtherUserAvatar( userData.photoURL || null);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching chat metadata:", error);
            }
        };

        fetchChatMetadata();
        // CRITICAL: Depend on the string primitive targetSeller?.uid, NOT the targetSeller object.
        // This absolutely guarantees that object-reference infinite loops cannot happen.
    }, [chatId, currentUserId, targetSeller?.uid]);


    // --- REAL-TIME MESSAGES SUBCOLLECTION FEED ---
    useEffect(() => {
        if (!chatId) {
            setLoading(false);
            return;
        }

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedMessages = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(fetchedMessages);
            setLoading(false);
        }, (error) => {
                console.error("Error loading chat room messages:", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [chatId]);

    useEffect(() => {
        if (!chatId || !currentUserId) return;

        // Escuta diretamente o documento de review gerado por este utilizador para este chat
        const reviewRef = doc(db, 'reviews', `${chatId}_${currentUserId}`);

        const unsubscribe = onSnapshot(reviewRef, (docSnap) => {
            setHasReviewed(docSnap.exists());
        });

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

    const handleShowQRCode = (code) => {
        navigation.navigate(ROUTES.QR_DISPLAY, { 
            verificationCode: code 
        });
    };

    const handleOpenScanner = (expectedCode, messageId) => {
        navigation.navigate(ROUTES.QR_SCANNER, {
            expectedCode: expectedCode,
            messageId: messageId,
            chatId: chatId
        });
    };

    const handleResolveOffer = async (messageId, newStatus, bookId = null, senderIdOfOffer = null) => {
        try {
            let displayerId = senderIdOfOffer; // The person who originally sent the proposal
            let scannerId = currentUserId;     // The person who is pressing "Accept" right now

            // 1. Update the message status in the chat room
            await ChatService.updateOfferStatus(chatId, messageId, newStatus, displayerId, scannerId);
            console.log("Chat offer status updated successfully.");

            // 2. Safely attempt to reserve the book on the main feed
            if (newStatus === 'accepted') {
                const targetBookId = bookId || publicationId;
                if (targetBookId) {
                    try {
                        const publicationRef = doc(db, 'publications', targetBookId);
                        await updateDoc(publicationRef, { 
                            status: PUBLICATION_STATUS.RESERVED 
                        });
                        console.log(`Success: Publication ${targetBookId} is now reserved.`);
                    } catch (permError) {
                        console.error("Rules blocked reserving the book, check Firestore Rules:", permError);
                    }
                } else {
                    console.warn("Offer accepted, but no book ID could be resolved.");
                }
            }
        } catch (error) {
            console.error("Failed to update trade workflow context:", error);
        }
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

    const renderOfferCard = (item) => {
        const offer = item.offerDetails;
        const isReceivedOffer = item.senderId !== currentUserId;
        const isPending = offer?.status === 'pending';
        const isCounterOffer = offer?.isCounter === true; 

        // Clean status colors
        let statusBg = '#FEF3C7'; 
        let statusTextColor = '#92400E';
        if (offer?.status === 'accepted') {
            statusBg = '#E1F7EC'; 
            statusTextColor = '#065F46';
        } else if (offer?.status === 'declined' || offer?.status === 'countered') {
            statusBg = '#FEE2E2'; 
            statusTextColor = '#991B1B';
        } else if (offer?.status === 'completed') {
            statusBg = '#DCFCE7'; 
            statusTextColor = '#166534';
        }

        return (
            <View style={[
                styles.offerCard, 
                { 
                    backgroundColor: theme.backgroundElement, 
                    borderColor: isPending && isCounterOffer ? theme.primary : theme.borderLight,
                    borderWidth: isPending && isCounterOffer ? 2 : 1
                }
            ]}>
                {/* HEADER */}
                <View style={styles.offerHeader}>
                    <Iconify icon="lucide:arrow-left-right" size={18} color={theme.primary} />
                    <Text style={[styles.offerTitle, { color: theme.textItemTitle }]}>
                        {isCounterOffer ? "Counter Proposal" : "Swap Proposal"}
                    </Text>
                </View>

                {/* SIDE-BY-SIDE TRADE CONTAINER */}
                <View style={styles.tradeContainer}>
                    {/* Left Side: Target Book */}
                    <View style={styles.bookColumn}>
                        <Text style={[styles.bookMiniLabel, { color: theme.subtext }]} numberOfLines={1}>
                            Target Book
                        </Text>
                        {bookImage ? (
                            <Image source={{ uri: bookImage }} style={styles.tradeBookImage} />
                        ) : (
                            <View style={[styles.tradeBookImage, styles.placeholderBg]}>
                                <Iconify icon="lucide:book" size={20} color={theme.subtext} />
                            </View>
                        )}
                    </View>

                    {/* Middle: Exchange Icon */}
                    <Iconify icon="lucide:arrow-right-left" size={20} color={theme.subtext} style={{ marginHorizontal: 8 }} />

                    {/* Right Side: Offered Book(s) */}
                    <View style={styles.bookColumn}>
                        <Text style={[styles.bookMiniLabel, { color: theme.subtext }]} numberOfLines={1}>
                            {isCounterOffer ? "Offered Book" : "Options"}
                        </Text>
                        
                        {/* Try to show the offered book image, otherwise show a clean minimal badge */}
                        {offer?.selectedBookImage ? (
                            <Image source={{ uri: offer.selectedBookImage }} style={styles.tradeBookImage} />
                        ) : (
                            <View style={[styles.tradeBookImage, styles.placeholderBg]}>
                                {isCounterOffer ? (
                                    <Iconify icon="lucide:book-open" size={20} color={theme.primary} />
                                ) : (
                                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textItemTitle }}>
                                        {offer?.offeredBookIds?.length || 1}
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                </View>

                {/* LOCATION DETAILS (CLICKABLE) */}
                {offer?.location ? (
                    <TouchableOpacity 
                        style={styles.clickableLocationRow} 
                        onPress={() => handleOpenNavigation(offer.location)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.offerText, { color: theme.subtext, flex: 1, marginTop: 0 }]}>
                            Location: <Text style={{ fontWeight: '600', color: theme.textItemTitle, textDecorationLine: 'underline' }}>
                                {offer?.location?.title || offer?.location?.address || 'Not specified'}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <Text style={[styles.offerText, { color: theme.subtext, marginTop: 12 }]}>
                        Location: <Text style={{ fontWeight: '600', color: theme.textItemTitle }}>Not specified</Text>
                    </Text>
                )}

                {/* STATUS BADGE */}
                <View style={[styles.statusBadge, { backgroundColor: statusBg, marginTop: 12 }]}>
                    <Text style={{ color: statusTextColor, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>
                        {offer?.status || 'Pending'}
                    </Text>
                </View>

                {/* 3-BUTTON ACTION FLOW */}
                {isReceivedOffer && isPending && (
                    <View style={styles.offerActions}>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.declineButton]} 
                            onPress={() => handleResolveOffer(item.id, 'declined')}
                        >
                            <Text style={styles.declineButtonText}>Decline</Text>
                        </TouchableOpacity>

                        {isCounterOffer && (
                            <TouchableOpacity 
                                style={[styles.actionButton, styles.counterBackButton, { borderColor: theme.primary || '#E58A1F' }]}
                                onPress={() => navigation.navigate(ROUTES.SELECT_SWAP_BOOK, { 
                                    messageId: item.id, 
                                    chatId: chatId,
                                    offerDetails: offer,
                                    targetSellerUid: targetSeller?.uid || item.senderId
                                })} 
                            >
                                <Text style={[styles.counterBackText, { color: theme.primary || '#E58A1F' }]}>Counter</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: theme.primary || '#E58A1F' }]}
                            onPress={() => {
                                if (!isCounterOffer) {
                                    navigation.navigate(ROUTES.SELECT_SWAP_BOOK, { 
                                        messageId: item.id, 
                                        chatId: chatId,
                                        offerDetails: offer,
                                        targetSellerUid: targetSeller?.uid || item.senderId
                                    });
                                } else {
                                    handleResolveOffer(item.id, 'accepted', offer?.targetBookId, item.senderId);
                                }
                            }} 
                        >
                            <Text style={styles.acceptButtonText}>
                                {isCounterOffer ? "Accept" : "Review"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
                {/* --- VERIFICATION HANDSHAKE UI --- */}
                {offer?.status === 'accepted' && (
                    <View style={styles.offerActions}>
                        {/* DISPLAYER (Show QR): Uses your Primary Dark Brown */}
                        {offer.verificationDisplayerId === currentUserId && (
                            <TouchableOpacity 
                                style={[styles.actionButton, { backgroundColor: theme.primary }]}
                                onPress={() => handleShowQRCode(offer.verificationCode)}
                            >
                                <Iconify icon="lucide:qr-code" size={18} color={theme.primaryText} style={{ marginRight: 8 }} />
                                <Text style={[styles.acceptButtonText, { color: theme.primaryText }]}>
                                    Show Swap Code
                                </Text>
                            </TouchableOpacity>
                        )}

                        {offer.verificationScannerId === currentUserId && (
                            <TouchableOpacity 
                                style={[styles.actionButton, { backgroundColor: theme.textItemTitle }]}
                                onPress={() => handleOpenScanner(offer.verificationCode, item.id)}
                            >
                                <Iconify 
                                    icon="lucide:scan" 
                                    size={18} 
                                    // White for light mode, rich dark brown for dark mode beige background
                                    color={colorScheme === 'dark' ? '#1C0E05' : '#FFFFFF'} 
                                    style={{ marginRight: 8 }} 
                                />
                                <Text style={[
                                    styles.acceptButtonText, 
                                    { color: colorScheme === 'dark' ? '#1C0E05' : '#FFFFFF' }
                                ]}>
                                    Scan Code
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* --- COMPLETED SWAP UI --- */}
                {offer?.status === 'completed' && (
                    <View style={styles.completedContainer}>
                        {/* O título celebra sempre o facto de a troca ter terminado */}
                        <View style={styles.completedHeader}>
                            <Iconify icon="lucide:party-popper" size={24} color="#10B981" />
                            <Text style={styles.completedText}>Troca Concluída!</Text>
                        </View>

                        {/* O botão gere a ação de avaliar */}
                        <TouchableOpacity 
                            style={[
                                styles.actionButton, 
                                { 
                                    backgroundColor: hasReviewed ? theme.backgroundElement : theme.textItemTitle, 
                                    borderColor: hasReviewed ? theme.borderLight : 'transparent',
                                    borderWidth: hasReviewed ? 1 : 0,
                                    width: '100%' 
                                }
                            ]}
                            onPress={() => {
                                navigation.navigate(ROUTES.REVIEW_SWAPPER, { 
                                    targetUserId: targetSeller?.uid || item.senderId,
                                    chatId: chatId 
                                });
                            }}
                            disabled={hasReviewed}
                        >
                            <Iconify 
                                icon={hasReviewed ? "lucide:check-circle" : "lucide:star"} 
                                size={18} 
                                // Dá um tom verde ao ícone se já foi avaliado para reforçar o sucesso
                                color={hasReviewed ? "#10B981" : theme.background} 
                                style={{ marginRight: 8 }} 
                            />
                            <Text style={[
                                styles.acceptButtonText, 
                                // Muda a cor do texto para condizer
                                { color: hasReviewed ? theme.subtext : theme.background }
                            ]}>
                                {hasReviewed ? "Avaliação Enviada" : "Avaliar Utilizador"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const renderMessageItem = ({ item }) => {
        const isMe = item.senderId === currentUserId;

        if (item.type === 'offer') {
            return (
                <View style={styles.offerCardContainer}>
                    {renderOfferCard(item)}
                </View>
            );
        }

        return (
            <View style={[styles.messageRow, { justifyContent: isMe ? 'flex-end' : 'flex-start' }]}>
                <View style={[
                    styles.bubble, 
                    isMe 
                        ? [styles.myBubble, { backgroundColor: theme.primary || '#E58A1F' }] 
                        : [styles.theirBubble, { backgroundColor: theme.backgroundElement, borderColor: theme.borderLight, borderWidth: 1 }]
                ]}>
                    <Text style={[styles.messageText, { color: isMe ? '#FFFFFF' : theme.textItemTitle }]}>
                        {item.text}
                    </Text>
                </View>
            </View>
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

                <View style={styles.headerSpacer} />
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
    messageRow: { flexDirection: 'row', marginVertical: 4, width: '100%' },
    bubble: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, maxWidth: '75%' },
    myBubble: { borderBottomRightRadius: 4 },
    theirBubble: { borderBottomLeftRadius: 4 },
    messageText: { fontSize: 15, lineHeight: 20 },

    offerCardContainer: { width: '100%', alignItems: 'center', marginVertical: 12 },
    offerCard: { width: '90%', borderRadius: 16, borderWidth: 1, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    offerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    offerTitle: { fontSize: 15, fontWeight: '700' },
    offerText: { fontSize: 14, marginBottom: 8 },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 12 },
    offerActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
    actionButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
    declineButton: { backgroundColor: '#F3F4F6' },
    declineButtonText: { color: '#374151', fontWeight: '600', fontSize: 14 },
    acceptButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },

    inputContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, alignItems: 'center', gap: 12 },
    input: { flex: 1, minHeight: 40, maxHeight: 100, borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, fontSize: 15 },
    sendButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    arrowIconContainer: { 
        width: 32, 
        height: 32, 
        borderRadius: 16, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    tradeContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        backgroundColor: 'rgba(150, 150, 150, 0.08)',
        padding: 12, 
        borderRadius: 8, 
        marginTop: 4 
    },
    bookColumn: { 
        alignItems: 'center', 
        flex: 1 
    },
    bookMiniLabel: { 
        fontSize: 11, 
        fontWeight: '600', 
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    tradeBookImage: { 
        width: 48, 
        height: 68, 
        borderRadius: 6, 
        backgroundColor: '#EAEAEA' 
    },
    placeholderBg: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.2)',
    },
    counterBackButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
    },
    counterBackText: {
        fontWeight: '600',
        fontSize: 14,
    },
    clickableLocationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 12,
        paddingVertical: 2,
    },
    clickableLocationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 12,
        paddingVertical: 2,
    },
    // NOVOS ESTILOS AQUI:
    completedContainer: { 
        marginTop: 16, 
        alignItems: 'center', 
        width: '100%', 
        borderTopWidth: 1, 
        borderTopColor: 'rgba(150, 150, 150, 0.2)', 
        paddingTop: 16 
    },
    completedHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 16 
    },
    completedText: { 
        marginLeft: 8, 
        fontSize: 16, 
        fontWeight: '700', 
        color: '#10B981' 
    }
});
