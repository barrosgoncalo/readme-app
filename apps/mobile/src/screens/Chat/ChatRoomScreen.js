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
    Image
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
    const [bookImage, setBookImage] = useState(null);
    const [publicationId, setPublicationId] = useState(null);

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

    const handleResolveOffer = async (messageId, newStatus, bookId = null) => {
        try {
            // 1. This updates the message status in the chat room (Always do this first)
            await ChatService.updateOfferStatus(chatId, messageId, newStatus);
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

    const renderOfferCard = (item) => {
        const offer = item.offerDetails;
        const isReceivedOffer = item.senderId !== currentUserId;
        const isPending = offer?.status === 'pending';
        
        // Define if this is the first proposal or the counter-proposal
        const isCounterOffer = offer?.isCounter === true; 

        return (
            <View style={[styles.offerCard, { backgroundColor: theme.backgroundElement, borderColor: theme.borderLight }]}>
                <View style={styles.offerHeader}>
                    <Iconify icon="lucide:arrow-left-right" size={18} color={theme.primary} />
                    <Text style={[styles.offerTitle, { color: theme.textItemTitle }]}>
                        {isCounterOffer ? "Counter Proposal" : "Swap Proposal"}
                    </Text>
                </View>

                {/* 2. BOOK COVER INTEGRATION */}
                {bookImage && (
                    <View style={styles.offerBookContainer}>
                        <Image source={{ uri: bookImage }} style={styles.offerBookImage} />
                        <View style={styles.offerBookDetails}>
                            <Text style={[styles.offerText, { color: theme.subtext, marginBottom: 2 }]}>Target Book</Text>
                            <Text style={{ fontWeight: '600', color: theme.textItemTitle, fontSize: 13 }}>
                                Tap to view details
                            </Text>
                        </View>
                    </View>
                )}

                {/* 3. OFFER DETAILS */}
                <Text style={[styles.offerText, { color: theme.subtext, marginTop: 12 }]}>
                    Location: <Text style={{ fontWeight: '600', color: theme.textItemTitle }}>{offer?.location?.title || 'Not specified'}</Text>
                </Text>

                {isCounterOffer && offer?.selectedBookId && (
                     <Text style={[styles.offerText, { color: theme.subtext, marginTop: 4 }]}>
                     Requested: <Text style={{ fontWeight: '600', color: theme.primary }}>1 Book Selected</Text>
                 </Text>
                )}

                <View style={[styles.statusBadge, { backgroundColor: offer?.status === 'accepted' ? '#E1F7EC' : offer?.status === 'declined' ? '#FEE2E2' : '#FEF3C7' }]}>
                    <Text style={{ color: offer?.status === 'accepted' ? '#065F46' : offer?.status === 'declined' ? '#991B1B' : '#92400E', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>
                        {offer?.status || 'Pending'}
                    </Text>
                </View>

                {/* 4. ACTIONS FOR RECEIVER */}
                {isReceivedOffer && isPending && (
                    <View style={styles.offerActions}>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.declineButton]} 
                            onPress={() => handleResolveOffer(item.id, 'declined')}
                        >
                            <Text style={styles.declineButtonText}>Decline</Text>
                        </TouchableOpacity>

                        {/* SPLIT LOGIC: Initial Offer vs Counter Offer */}
                        {!isCounterOffer ? (
                            <TouchableOpacity 
                                style={[styles.actionButton, { backgroundColor: theme.primary || '#E58A1F' }]}
                                // Navigate to a new screen where they can pick from `offer.offeredBookIds`
                                onPress={() => navigation.navigate(ROUTES.SELECT_SWAP, { 
                                    messageId: item.id, 
                                    chatId: chatId,
                                    offerDetails: offer,
                                    targetSellerUid: targetSeller.uid
                                })} 
                            >
                                <Text style={styles.acceptButtonText}>Review & Choose</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity 
                                style={[styles.actionButton, { backgroundColor: theme.primary || '#E58A1F' }]}
                                // This is the FINAL accept by the original proposer
                                onPress={() => handleResolveOffer(item.id, 'accepted', offer?.targetBookId)} 
                            >
                                <Text style={styles.acceptButtonText}>Final Accept</Text>
                            </TouchableOpacity>
                        )}
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

                <View style={styles.headerProfileInfo}>
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
                </View>

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
    actionButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
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
    offerBookContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12, 
        backgroundColor: 'rgba(150, 150, 150, 0.1)', // Subtle contrast background 
        padding: 8, 
        borderRadius: 8, 
        marginTop: 4 
    },
    offerBookImage: { 
        width: 40, 
        height: 56, 
        borderRadius: 4, 
        backgroundColor: '#EAEAEA' 
    },
    offerBookDetails: { 
        flex: 1, 
        justifyContent: 'center' 
    },
});
