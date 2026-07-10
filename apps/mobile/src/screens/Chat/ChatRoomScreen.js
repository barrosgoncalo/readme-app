import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';

// Hooks
import { useChatRoomData } from '@readme/shared/src/hooks/use-chat-room-data';
import { useChatActions } from '@readme/shared/src/hooks/use-chat-actions';

// Components
import OfferMessageCard from '../../components/ui/OfferMessageCard';
import ChatBubble from '../../components/ui/ChatBubble';

export default function ChatRoomScreen({ route, navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { chatId, targetSeller } = route.params;

    const { currentUser } = useAuth();
    const currentUserId = currentUser?.uid;

    const [inputText, setInputText] = useState('');

    // 1. Fetch data
    const {
        messages,
        loading,
        otherUserName,
        otherUserAvatar,
        otherUserId,
        bookImage,
        publicationId,
        chatLocation,
        hasReviewed
    } = useChatRoomData(chatId, currentUserId, targetSeller);

    // 2. Bind action handlers
    const {
        isFetchingBook,
        handleSendMessage,
        handleShowQRCode,
        handleOpenScanner,
        handleResolveOffer,
        handleCancelSwap,
        handleOpenNavigation,
        handleOpenOptions,
        handleBookPress
    } = useChatActions({ 
        chatId, 
        currentUserId, 
        publicationId, 
        messages, 
        navigation 
    });

    // Local wrapper to clear input text immediately for better UI feel
    const onSendPress = () => {
        const text = inputText;
        setInputText('');
        handleSendMessage(text, setInputText);
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
                        onPress={onSendPress}
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
