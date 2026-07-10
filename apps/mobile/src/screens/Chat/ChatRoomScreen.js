import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { Colors } from '@readme/shared/src/constants/theme';
import { buildChatRoomStyles } from '../../styles/chatRoomStyles';
import { useChatRoomData } from '@readme/shared/src/hooks/use-chat-room-data';
import { useChatActions } from '@readme/shared/src/hooks/use-chat-actions';
import ChatHeader from './Components/ChatHeader';
import ChatInputBar from './Components/ChatInputBar';
import MessageListItem from './Components/MessageListItem';

export default function ChatRoomScreen({ route, navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = useMemo(() => buildChatRoomStyles(theme), [theme]);

    const { chatId, targetSeller } = route.params;
    const { currentUser } = useAuth();
    const currentUserId = currentUser?.uid;

    const flatListRef = useRef(null);
    const prevNewestIdRef = useRef(null);
    const [inputText, setInputText] = useState('');
    const [inputBarHeight, setInputBarHeight] = useState(72); // sane fallback before first layout

    const {
        messages, loading, otherUserName, otherUserAvatar,
        otherUserId, bookImage, publicationId, chatLocation, hasReviewed
    } = useChatRoomData(chatId, currentUserId, targetSeller);

    const {
        isFetchingBook, handleSendMessage, handleShowQRCode,
        handleOpenScanner, handleResolveOffer, handleCancelSwap,
        handleOpenNavigation, handleOpenOptions, handleBookPress
    } = useChatActions({ chatId, currentUserId, publicationId, messages, navigation });

    const onSendPress = useCallback(() => {
        const text = inputText;
        setInputText('');
        handleSendMessage(text, setInputText);
    }, [inputText, handleSendMessage]);

    // Scroll to bottom whenever a NEW message from me actually lands in the list
    useEffect(() => {
        if (!messages.length) return;
        const newest = messages[0];
        const isNewMessage = newest.id !== prevNewestIdRef.current;
        prevNewestIdRef.current = newest.id;

        if (isNewMessage && newest.senderId === currentUserId) {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }
    }, [messages, currentUserId]);

    const renderMessageItem = useCallback(({ item, index }) => {
        const isMe = item.senderId === currentUserId;
        const isLastInGroup = index === 0 || messages[index - 1]?.senderId !== item.senderId;

        return (
            <MessageListItem
                item={item} isMe={isMe} isLastInGroup={isLastInGroup} theme={theme}
                colorScheme={colorScheme} currentUserId={currentUserId} chatId={chatId}
                targetSeller={targetSeller} bookImage={bookImage} chatLocation={chatLocation}
                isFetchingBook={isFetchingBook} hasReviewed={hasReviewed} navigation={navigation}
                onBookPress={handleBookPress} onOpenNavigation={handleOpenNavigation}
                onResolveOffer={handleResolveOffer} onShowQRCode={handleShowQRCode}
                onOpenScanner={handleOpenScanner} onCancelSwap={handleCancelSwap}
            />
        );
    }, [
        currentUserId, messages, theme, colorScheme, chatId, targetSeller,
        bookImage, chatLocation, isFetchingBook, hasReviewed, navigation,
        handleBookPress, handleOpenNavigation, handleResolveOffer,
        handleShowQRCode, handleOpenScanner, handleCancelSwap
    ]);

    return (
        <View style={styles.container}>
            <ChatHeader
                theme={theme} navigation={navigation} otherUserId={otherUserId}
                otherUserAvatar={otherUserAvatar} otherUserName={otherUserName}
                handleOpenOptions={handleOpenOptions}
            />

            {loading ? (
                <View style={styles.centerLoading}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item.id}
                        renderItem={renderMessageItem}
                        inverted={true}
                        contentContainerStyle={[
                            styles.listContainer,
                            { flexGrow: 1, justifyContent: 'flex-end' }
                        ]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    />
                )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={8}
            >
                <View onLayout={(e) => {
                    const h = e.nativeEvent.layout.height;
                    if (h > 0 && Math.abs(h - inputBarHeight) > 1) {
                        setInputBarHeight(h);
                    }
                }}>
                    <ChatInputBar
                        theme={theme} inputText={inputText}
                        setInputText={setInputText} onSendPress={onSendPress}
                    />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}
