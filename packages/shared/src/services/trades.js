// @readme/shared/src/services/trades.js
import { DB } from './DB';
import { ChatService } from './chat';
import { NEGOTIATION_STATUS } from '@readme/shared/src/constants/status';

export const TradeService = {

    /**
     * Resolves an offer (Accepts or Rejects it).
     * Automatically coordinates message status updates and book reservations.
     */
    resolveOffer: async (chatId, messageId, newStatus, details = {}) => {
        const { 
            proposerId, 
            receiverId, 
            targetBookId, 
            finalSelectedBookId, 
            finalSelectedBookImage 
        } = details;

        try {
            // 1. Update the message text/metadata via ChatService
            await ChatService.updateOfferStatus(
                chatId,
                messageId,
                newStatus,
                proposerId,
                receiverId,
                finalSelectedBookId,
                finalSelectedBookImage
            );

            // 2. If accepted, reserve both books in the inventory so others cannot request them
            if (newStatus === NEGOTIATION_STATUS.ACCEPTED) {
                const reservePromises = [];

                if (targetBookId) {
                    reservePromises.push(DB.update('publications', targetBookId, { status: 'reserved' }));
                }
                if (finalSelectedBookId) {
                    reservePromises.push(DB.update('publications', finalSelectedBookId, { status: 'reserved' }));
                }

                if (reservePromises.length > 0) {
                    await Promise.all(reservePromises);
                }
            }
        } catch (error) {
            console.error("TradeService.resolveOffer failed:", error);
            throw error;
        }
    },

    /**
     * Cancels an active swap arrangement.
     * Changes the message status and frees up the books back into the public market.
     */
    cancelSwap: async (chatId, messageId, targetBookId, finalSelectedBookId) => {
        try {
            // 1. Update the message state (Assuming CANCELLED exists in your NEGOTIATION_STATUS)
            const cancelStatus = NEGOTIATION_STATUS.CANCELLED || 'cancelled';
            await ChatService.updateOfferStatus(chatId, messageId, cancelStatus);

            // 2. Free up the inventory (make them available again)
            const releasePromises = [];

            if (targetBookId) {
                releasePromises.push(DB.update('publications', targetBookId, { status: 'available' }));
            }
            if (finalSelectedBookId) {
                releasePromises.push(DB.update('publications', finalSelectedBookId, { status: 'available' }));
            }

            if (releasePromises.length > 0) {
                await Promise.all(releasePromises);
            }
        } catch (error) {
            console.error("TradeService.cancelSwap failed:", error);
            throw error;
        }
    }
};
