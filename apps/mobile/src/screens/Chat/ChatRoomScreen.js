import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, useColorScheme } from 'react-native';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { Colors } from '@readme/shared/src/constants/theme';

// Hooks
import { useChatRoomData } from '@readme/shared/src/hooks/use-chat-room-data';
import { useChatActions } from '@readme/shared/src/hooks/use-chat-actions';

// Extracted Components
import ChatHeader from './Components/ChatHeader';
import ChatInputBar from './Components/ChatInputBar';
import MessageListItem from './Components/MessageListItem';

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

    const onSendPress = useCallback(() => {
        const text = inputText;
        setInputText('');
        handleSendMessage(text, setInputText);
    }, [inputText, handleSendMessage]);

    const renderMessageItem = useCallback(({ item, index }) => {
        const isMe = item.senderId === currentUserId;
        const isLastInGroup = index === 0 || messages[index - 1]?.senderId !== item.senderId;

        return (
            <MessageListItem
                item={item}
                isMe={isMe}
                isLastInGroup={isLastInGroup}
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
        );
    }, [
        currentUserId, messages, theme, colorScheme, chatId, targetSeller, 
        bookImage, chatLocation, isFetchingBook, hasReviewed, navigation, 
        handleBookPress, handleOpenNavigation, handleResolveOffer, 
        handleShowQRCode, handleOpenScanner, handleCancelSwap
    ]);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ChatHeader 
                theme={theme}
                navigation={navigation}
                otherUserId={otherUserId}
                otherUserAvatar={otherUserAvatar}
                otherUserName={otherUserName}
                handleOpenOptions={handleOpenOptions}
            />

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

            <ChatInputBar 
                theme={theme}
                inputText={inputText}
                setInputText={setInputText}
                onSendPress={onSendPress}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { paddingHorizontal: 16, paddingVertical: 12 },
});
