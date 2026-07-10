import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import OfferMessageCard from '../../../components/ui/OfferMessageCard';
import ChatBubble from '../../../components/ui/ChatBubble';
import { buildChatRoomStyles } from '../../../styles/chatRoomStyles';

const MessageListItem = memo(({
    item,
    isMe,
    isLastInGroup,
    theme,
    colorScheme,
    currentUserId,
    chatId,
    targetSeller,
    bookImage,
    chatLocation,
    isFetchingBook,
    hasReviewed,
    navigation,
    onBookPress,
    onOpenNavigation,
    onResolveOffer,
    onShowQRCode,
    onOpenScanner,
    onCancelSwap
}) => {
    const styles = useMemo(() => buildChatRoomStyles(theme), [theme]);

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
                    onBookPress={onBookPress}
                    onOpenNavigation={onOpenNavigation}
                    onResolveOffer={onResolveOffer}
                    onShowQRCode={onShowQRCode}
                    onOpenScanner={onOpenScanner}
                    onCancelSwap={onCancelSwap}
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
});

export default MessageListItem;
