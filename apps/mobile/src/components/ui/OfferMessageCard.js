import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Iconify } from 'react-native-iconify';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { useCounterOffer } from '@readme/shared/src/contexts/CounterOfferContext';

export default function OfferMessageCard({
    item,
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
    onCancelSwap,
}) {
    const { initCounterOffer } = useCounterOffer();
    
    const offer = item.offerDetails;
    const isReceivedOffer = item.senderId !== currentUserId;
    const isPending = offer?.status === 'pending';
    const isCounterOffer = offer?.isCounter === true;
    const bubbleTargetImage = offer?.targetBookImage || bookImage;

    const resolvedLocation = offer?.location || item?.location || chatLocation;

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
    } else if (offer?.status === 'unavailable') {
        statusBg = '#FEE2E2';
        statusTextColor = '#991B1B';
    }

    const hasSingleBookImage = offer?.offeredBooks?.length === 1 && offer?.offeredBooks[0]?.image;
    const imageToShow = offer?.finalSelectedBookImage || offer?.selectedBookImage || (hasSingleBookImage ? offer.offeredBooks[0].image : null);

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

                    <TouchableOpacity
                        activeOpacity={0.7}
                        disabled={isFetchingBook}
                        onPress={() => onBookPress(offer.targetBookId)}
                    >
                        {bubbleTargetImage ? (
                            <Image source={{ uri: bubbleTargetImage }} style={styles.tradeBookImage} />
                        ) : (
                            <View style={[styles.tradeBookImage, styles.placeholderBg]}>
                                <Iconify icon="lucide:book" size={20} color={theme.subtext} />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <Iconify icon="lucide:arrow-right-left" size={20} color={theme.subtext} style={{ marginHorizontal: 8 }} />

                {/* Right Side: Offered Book(s) */}
                <View style={styles.bookColumn}>
                    <Text style={[styles.bookMiniLabel, { color: theme.subtext }]} numberOfLines={1}>
                        {(isCounterOffer || offer?.offeredBooks?.length === 1) ? "Offered Book" : "Options"}
                    </Text>

                    <TouchableOpacity
                        activeOpacity={0.7}
                        disabled={isFetchingBook}
                        onPress={() => {
                            const books = item.offeredBooks || offer?.offeredBooks;
                            const bookId = offer?.selectedBookId || (books?.length === 1 ? books[0]?.id : null);
                            if (bookId) onBookPress(bookId);
                        }}
                    >
                        {imageToShow ? (
                            <Image source={{ uri: imageToShow }} style={styles.tradeBookImage} />
                        ) : (
                            <View style={[styles.tradeBookImage, styles.placeholderBg]}>
                                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textItemTitle }}>
                                    {offer?.offeredBooks?.length || offer?.offeredBookIds?.length || 1}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* LOCATION DETAILS */}
            {resolvedLocation ? (
                <TouchableOpacity
                    style={styles.clickableLocationRow}
                    onPress={() => onOpenNavigation(resolvedLocation)}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.offerText, { color: theme.subtext, flex: 1, marginTop: 0 }]}>
                        Location: <Text style={{ fontWeight: '600', color: theme.textItemTitle, textDecorationLine: 'underline' }}>
                            {resolvedLocation.title || resolvedLocation.address || 'View on Map'}
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
                        onPress={() => onResolveOffer(item.id, 'declined')}
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
                                targetSellerUid: item.senderId
                            })}
                        >
                            <Text style={[styles.counterBackText, { color: theme.primary || '#E58A1F' }]}>Counter</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.primary || '#E58A1F' }]}
                        onPress={() => {
                            if (!isCounterOffer) {
                                const offeredBooks = offer?.offeredBooks || [];

                                if (offeredBooks.length === 1) {
                                    initCounterOffer({
                                        chatId: chatId,
                                        messageId: item.id,
                                        targetSellerUid: item.senderId,
                                        offerDetails: offer,
                                        selectedBookId: offeredBooks[0].id,
                                    });
                                    
                                    navigation.navigate(ROUTES.SELECT_SWAP_LOCATION, {
                                        messageId: item.id,
                                        chatId: chatId,
                                        offerDetails: offer,
                                        targetSellerUid: item.senderId,
                                        selectedBookId: offeredBooks[0].id,
                                        selectedBookImage: offeredBooks[0].image || null
                                    });
                                } else {
                                    navigation.navigate(ROUTES.SELECT_SWAP_BOOK, {
                                        messageId: item.id,
                                        chatId: chatId,
                                        offerDetails: offer,
                                        targetSellerUid: item.senderId
                                    });
                                }
                            } else {
                                onResolveOffer(
                                    item.id,
                                    'accepted',
                                    offer?.targetBookId,
                                    item.senderId,
                                    offer?.selectedBookId,
                                    offer?.selectedBookImage
                                );
                            }
                        }}
                    >
                        <Text style={styles.acceptButtonText}>
                            {isCounterOffer ? "Accept" : "Review"}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* VERIFICATION HANDSHAKE */}
            {offer?.status === 'accepted' && (
                <View style={styles.acceptedWorkflowContainer}>
                    {offer.verificationDisplayerId === currentUserId && (
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: theme.primary }]}
                            onPress={() => onShowQRCode(offer.verificationCode, item.id)}
                        >
                            <Iconify icon="lucide:qr-code" size={18} color={theme.primaryText} style={{ marginRight: 8 }} />
                            <Text style={[styles.acceptButtonText, { color: theme.primaryText }]}>
                                Show Code
                            </Text>
                        </TouchableOpacity>
                    )}

                    {offer.verificationScannerId === currentUserId && (
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: theme.textItemTitle }]}
                            onPress={() => onOpenScanner(item.id)}
                        >
                            <Iconify
                                icon="lucide:scan"
                                size={18}
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

                    <TouchableOpacity
                        style={[styles.cancelSwapButton, { borderColor: theme.borderLight }]}
                        onPress={() => onCancelSwap(item.id, offer?.targetBookId, offer?.selectedBookId)}
                        activeOpacity={0.6}
                    >
                        <Iconify icon="lucide:ban" size={15} color="#EF4444" style={{ marginRight: 6 }} />
                        <Text style={styles.cancelSwapButtonText}>Cancel Swap Agreement</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* COMPLETED SWAP */}
            {offer?.status === 'completed' && (
                <View style={styles.completedContainer}>
                    <View style={styles.completedHeader}>
                        <Iconify icon="lucide:party-popper" size={24} color="#10B981" />
                        <Text style={styles.completedText}>Trade completed!</Text>
                    </View>

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
                                chatId: chatId,
                                swapId: item.id
                            });
                        }}
                        disabled={hasReviewed}
                    >
                        <Iconify
                            icon={hasReviewed ? "lucide:check-circle" : "lucide:star"}
                            size={18}
                            color={hasReviewed ? "#10B981" : theme.background}
                            style={{ marginRight: 8 }}
                        />
                        <Text style={[
                            styles.acceptButtonText,
                            { color: hasReviewed ? theme.subtext : theme.background }
                        ]}>
                            {hasReviewed ? "Review Submitted" : "Review User"}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* CANCELLED SWAP */}
            {offer?.status === 'cancelled' && (
                <View style={styles.completedContainer}>
                    <View style={styles.completedHeader}>
                        <Text style={[styles.completedText, { color: '#EF4444', fontSize: 14 }]}>
                            {offer.cancelledBy === currentUserId
                                ? "You cancelled this swap agreement"
                                : "The other user cancelled this swap agreement"}
                        </Text>
                    </View>

                    {offer.cancelledBy !== currentUserId && (
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
                                    chatId: chatId,
                                    swapId: item.id
                                });
                            }}
                            disabled={hasReviewed}
                        >
                            <Iconify
                                icon={hasReviewed ? "lucide:check-circle" : "lucide:star"}
                                size={18}
                                color={hasReviewed ? "#10B981" : theme.background}
                                style={{ marginRight: 8 }}
                            />
                            <Text style={[
                                styles.acceptButtonText,
                                { color: hasReviewed ? theme.subtext : theme.background }
                            ]}>
                                {hasReviewed ? "Review Submitted" : "Review User"}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* UNAVAILABLE TRADE */}
            {offer?.status === 'unavailable' && (
                <View style={styles.completedContainer}>
                    <View style={styles.completedHeader}>
                        <Iconify icon="lucide:alert-triangle" size={20} color="#EF4444" />
                        <Text style={[styles.completedText, { color: '#EF4444', fontSize: 14 }]}>
                            This trade is no longer available
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
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
    acceptedWorkflowContainer: { marginTop: 4, width: '100%', gap: 8 },
    cancelSwapButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 10, borderRadius: 12, borderWidth: 1,
        backgroundColor: 'transparent', marginTop: 4
    },
    cancelSwapButtonText: { color: '#EF4444', fontWeight: '600', fontSize: 13 },
    tradeContainer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'rgba(150, 150, 150, 0.08)', padding: 12, borderRadius: 8, marginTop: 4
    },
    bookColumn: { alignItems: 'center', flex: 1 },
    bookMiniLabel: { fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    tradeBookImage: { width: 48, height: 68, borderRadius: 6, backgroundColor: '#EAEAEA' },
    placeholderBg: { justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(150, 150, 150, 0.2)' },
    counterBackButton: { backgroundColor: 'transparent', borderWidth: 1 },
    counterBackText: { fontWeight: '600', fontSize: 14 },
    clickableLocationRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12, paddingVertical: 2 },
    completedContainer: { marginTop: 16, alignItems: 'center', width: '100%', borderTopWidth: 1, borderTopColor: 'rgba(150, 150, 150, 0.2)', paddingTop: 16 },
    completedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    completedText: { marginLeft: 8, fontSize: 16, fontWeight: '700', color: '#10B981' },
});
