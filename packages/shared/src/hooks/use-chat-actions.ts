import { useState } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { ChatService } from '@readme/shared/src/services/chat';
import { TradeService } from '../services/trades';
import { PublicationService } from '@readme/shared/src/services/publications';
import { LocationService } from '@readme/shared/src/services/location';
import { ReportsService } from '@readme/shared/src/services/reports';
import { REPORT_TARGET_TYPE, REPORT_REASON_LABELS } from '@readme/shared/src/constants/status';

export function useChatActions({
                                   chatId,
                                   currentUserId,
                                   publicationId,
                                   messages,
                                   navigation,
                                   otherUserId,
                                   otherUserName,
                                   otherUserAvatar
                               }) {
    const [isFetchingBook, setIsFetchingBook] = useState(false);

    const handleSendMessage = async (textToSend, restoreInputText) => {
        if (!textToSend.trim() || !currentUserId) return;

        try {
            await ChatService.sendTextMessage(chatId, currentUserId, textToSend);
        } catch (error) {
            console.error("Error sending message:", error);
            restoreInputText(textToSend);
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
            const targetBookId = bookId || publicationId;

            await TradeService.resolveOffer(chatId, messageId, newStatus, {
                proposerId: senderIdOfOffer,
                receiverId: currentUserId,
                targetBookId: targetBookId,
                finalSelectedBookId: finalSelectedBookId,
                finalSelectedBookImage: finalSelectedBookImage
            });
            console.log("Chat offer status and inventory updated successfully.");
        } catch (error) {
            console.error("Failed to update trade workflow context:", error);
            Alert.alert("Error", "Could not process the offer. Please try again.");
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
                            const targetBookId = bookId || publicationId;
                            await TradeService.cancelSwap(
                                chatId,
                                messageId,
                                targetBookId,
                                finalSelectedBookId,
                                currentUserId
                            );
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

        const { appleMapsUrl, googleMapsUrl, wazeUrl } = LocationService.buildNavigationLinks(location);

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

    const submitChatReport = async (reason) => {
        try {
            const snapshot = ReportsService.buildChatSnapshot(
                messages,
                { name: otherUserName, avatarUrl: otherUserAvatar }
            );

            await ReportsService.submitReport(
                currentUserId,
                REPORT_TARGET_TYPE.CHAT,
                chatId,
                otherUserId,
                reason,
                snapshot
            );

            Alert.alert("Report Submitted", "Thanks — our team will review this conversation.");
        } catch (error) {
            console.error("Error reporting chat:", error);
            Alert.alert("Something Went Wrong", "We couldn't submit your report. Please try again.");
        }
    };

    const handleReportChat = () => {
        if (!otherUserId) {
            Alert.alert("Something Went Wrong", "We couldn't identify who to report. Please try again.");
            return;
        }

        Alert.alert(
            "Report Chat",
            "Why are you reporting this conversation?",
            [
                { text: "Cancel", style: "cancel" },
                ...Object.entries(REPORT_REASON_LABELS).map(([reason, label]) => ({
                    text: label,
                    onPress: () => submitChatReport(reason)
                }))
            ]
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
                },
                {
                    text: "Report Chat",
                    style: "destructive",
                    onPress: handleReportChat
                }
            ]
        );
    };

    const handleBookPress = async (bookSummary) => {
        if (!bookSummary?.id) return;

        try {
            setIsFetchingBook(true);
            const fullPublicationData = await PublicationService.fetchPublication(bookSummary.id);

            if (fullPublicationData) {
                navigation.navigate(ROUTES.PUBLICATION_DETAILS, {
                    publication: fullPublicationData,
                    hideOfferButton: true
                });
            } else {
                Alert.alert("Unavailable", "This book details are no longer available.");
            }
        } catch (error) {
            console.error("Failed to fetch full book details:", error);
            Alert.alert("Error", "Could not load book details. Please try again.");
        } finally {
            setIsFetchingBook(false);
        }
    };

    return {
        isFetchingBook,
        handleSendMessage,
        handleShowQRCode,
        handleOpenScanner,
        handleResolveOffer,
        handleCancelSwap,
        handleOpenNavigation,
        handleOpenOptions,
        handleBookPress
    };
}
