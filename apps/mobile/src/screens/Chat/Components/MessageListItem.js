// MessageListItem.js
import React, { memo, useMemo, useRef, useEffect } from 'react';
import { View, Animated } from 'react-native';
import OfferMessageCard from '../../../components/ui/OfferMessageCard';
import ChatBubble from '../../../components/ui/ChatBubble';
import { buildChatRoomStyles } from '../../../styles/chatRoomStyles';

const RECENT_THRESHOLD_MS = 2000;

const MessageListItem = memo(({
    item, isMe, isLastInGroup, theme, colorScheme, currentUserId, chatId,
    targetSeller, bookImage, chatLocation, isFetchingBook, hasReviewed,
    navigation, onBookPress, onOpenNavigation, onResolveOffer,
    onShowQRCode, onOpenScanner, onCancelSwap
}) => {
    const styles = useMemo(() => buildChatRoomStyles(theme), [theme]);

    const isRecent = useMemo(() => {
        const ts = item.clientTimestamp ?? item.createdAt?.toMillis?.();
        return isMe && ts && Date.now() - ts < RECENT_THRESHOLD_MS;
    }, [item.id]);

    const opacity = useRef(new Animated.Value(isRecent ? 0 : 1)).current;
    const translateY = useRef(new Animated.Value(isRecent ? 12 : 0)).current;

    useEffect(() => {
        if (!isRecent) return;
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 220,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                friction: 8,
                tension: 80,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const content = item.type === 'offer' ? (
        <View style={styles.offerCardContainer}>
            <OfferMessageCard
                item={item} theme={theme} colorScheme={colorScheme}
                currentUserId={currentUserId} chatId={chatId} targetSeller={targetSeller}
                bookImage={bookImage} chatLocation={chatLocation} isFetchingBook={isFetchingBook}
                hasReviewed={hasReviewed} navigation={navigation} onBookPress={onBookPress}
                onOpenNavigation={onOpenNavigation} onResolveOffer={onResolveOffer}
                onShowQRCode={onShowQRCode} onOpenScanner={onOpenScanner} onCancelSwap={onCancelSwap}
            />
        </View>
    ) : (
        <ChatBubble item={item} isMe={isMe} isLastInGroup={isLastInGroup} theme={theme} colorScheme={colorScheme} />
    );

    if (!isRecent) return content;

    return (
        <Animated.View style={{ opacity, transform: [{ translateY }] }}>
            {content}
        </Animated.View>
    );
});

export default MessageListItem;
