import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { buildChatRoomStyles } from '../../styles/chatRoomStyles';
import { useChatRoomData } from '@readme/shared/src/hooks/use-chat-room-data';
import { useChatActions } from '@readme/shared/src/hooks/use-chat-actions';
import ChatHeader from './Components/ChatHeader';
import ChatInputBar from './Components/ChatInputBar';
import MessageListItem from './Components/MessageListItem';
import SystemDivider from './Components/SystemDivider';
import { ReportModal } from '../../components/ui/ReportModal';

export default function ChatRoomScreen({ route, navigation }) {
    const colorScheme = useColorScheme();
    const theme = useTheme();
    const styles = useMemo(() => buildChatRoomStyles(theme), [theme]);

    const { chatId, targetSeller } = route.params;
    const { currentUser } = useAuth();
    const currentUserId = currentUser?.uid;

    const flatListRef = useRef(null);
    const prevNewestIdRef = useRef(null);
    const [inputText, setInputText] = useState('');
    const [inputBarHeight, setInputBarHeight] = useState(72);

    const {
        messages, loading, otherUserName, otherUserAvatar,
        otherUserId, bookImage, publicationId, chatLocation, reviewedSwapIds,
        isChatDisabled, disabledReason
    } = useChatRoomData(chatId, currentUserId, targetSeller);

    const {
        isFetchingBook, handleSendMessage, handleShowQRCode,
        handleOpenScanner, handleResolveOffer, handleCancelSwap,
        handleOpenNavigation, handleOpenOptions, handleBookPress,
        reportModalVisible, reportModalProps
    } = useChatActions({
        chatId,
        currentUserId,
        publicationId,
        messages,
        navigation,
        otherUserId,
        otherUserName,
        otherUserAvatar
    });
    const onSendPress = useCallback(() => {
        const text = inputText;
        setInputText('');
        handleSendMessage(text, setInputText);
    }, [inputText, handleSendMessage]);

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
        if (item.type === 'system') {
            return <SystemDivider action={item.action || disabledReason} theme={theme} />;
        }

        const isMe = item.senderId === currentUserId;
        const isLastInGroup = index === 0 || messages[index - 1]?.senderId !== item.senderId;
        const hasReviewedThisSwap = reviewedSwapIds.has(item.id);

        return (
            <MessageListItem
                item={item} isMe={isMe} isLastInGroup={isLastInGroup} theme={theme}
                colorScheme={colorScheme} currentUserId={currentUserId} chatId={chatId}
                targetSeller={targetSeller} bookImage={bookImage} chatLocation={chatLocation}
                isFetchingBook={isFetchingBook} hasReviewed={hasReviewedThisSwap} navigation={navigation}
                onBookPress={handleBookPress} onOpenNavigation={handleOpenNavigation}
                onResolveOffer={handleResolveOffer} onShowQRCode={handleShowQRCode}
                onOpenScanner={handleOpenScanner} onCancelSwap={handleCancelSwap}
            />
        );
    }, [
        currentUserId, messages, theme, colorScheme, chatId, targetSeller,
        bookImage, chatLocation, isFetchingBook, reviewedSwapIds, navigation,
        handleBookPress, handleOpenNavigation, handleResolveOffer,
        handleShowQRCode, handleOpenScanner, handleCancelSwap, disabledReason
    ]);

    return (
        <View style={styles.container}>
            <ChatHeader
                theme={theme}
                navigation={navigation}
                otherUserId={otherUserId}
                otherUserAvatar={otherUserAvatar}
                otherUserName={isChatDisabled ? 'Deleted User' : otherUserName}
                isChatDisabled={isChatDisabled}
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

            {/* Hide the input bar completely if the chat is disabled */}
            {!isChatDisabled && (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? -30 : 0}
                >
                    <View onLayout={(e) => {
                        const h = e.nativeEvent.layout.height;
                        if (h > 0 && Math.abs(h - inputBarHeight) > 1) {
                            setInputBarHeight(h);
                        }
                    }}>
                        <ChatInputBar
                            theme={theme}
                            inputText={inputText}
                            setInputText={setInputText}
                            onSendPress={onSendPress}
                        />
                    </View>
                </KeyboardAvoidingView>
            )}

            {/* Report reason picker — replaces the old Alert-based picker
                that broke past 3 buttons on Android */}
            <ReportModal
                visible={reportModalVisible}
                {...reportModalProps}
            />
        </View>
    );
}
