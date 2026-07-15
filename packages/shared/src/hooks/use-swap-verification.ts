import { useEffect } from 'react';
import { Alert } from 'react-native';
import { ChatService } from '../services/chat';
import type { NavigationProp } from '@react-navigation/native';

interface OfferDetails {
    status?: string;
    [key: string]: any;
}

interface SwapMessageData {
    offerDetails?: OfferDetails;
    [key: string]: any;
}

/**
 * Watches a swap message's offerDetails.status and navigates back
 * automatically once the swap is completed/verified.
 */
export function useSwapVerification(
    chatId: string | undefined,
    messageId: string | undefined,
    navigation: NavigationProp<any>
) {
    useEffect(() => {
        if (!chatId || !messageId) return;

        const unsubscribe = ChatService.subscribeToMessage(
            chatId,
            messageId,
            (messageData: SwapMessageData | null) => {
                const offerDetails = messageData?.offerDetails;
                if (offerDetails && (offerDetails.status === 'completed' || offerDetails.status === 'verified')) {
                    navigation.goBack();
                }
            },
            (error: unknown) => {
                console.error("Error listening to swap message updates:", error);
                Alert.alert(
                    "Connection Error",
                    "Lost connection while waiting for swap verification. Please check your connection and try again.",
                    [{ text: "OK", onPress: () => navigation.goBack() }]
                );
            }
        );

        return () => unsubscribe();
    }, [chatId, messageId, navigation]);
}
