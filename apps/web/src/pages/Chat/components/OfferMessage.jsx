import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { ChatService } from '@readme/shared/src/services/chat';
import { NEGOTIATION_STATUS } from '@readme/shared/src/constants/status';
import styles from './OfferMessage.module.css';

const STATUS_COLORS = {
    pending: 'var(--secondary)',
    accepted: 'var(--success)',
    declined: 'var(--error)',
    countered: 'var(--bg-elem)',
};

export default function OfferMessage({ message, isOwn, currentUserId, chatId }) {
    const [busy, setBusy] = useState(false);
    const offer = message.offerDetails;

    if (!offer) return null;

    async function handleStatus(newStatus) {
        setBusy(true);
        try {
            const receiverId = isOwn ? message.senderId : currentUserId;
            const senderId = isOwn ? currentUserId : message.senderId;
            await ChatService.updateOfferStatus(chatId, message.id, newStatus, senderId, receiverId);
        } catch (err) {
            console.error('Error updating offer:', err);
        } finally {
            setBusy(false);
        }
    }

    const statusLabel = {
        [NEGOTIATION_STATUS.PENDING]: 'Pending',
        [NEGOTIATION_STATUS.ACCEPTED]: 'Accepted',
        [NEGOTIATION_STATUS.DECLINED]: 'Declined',
        countered: 'Countered',
    }[offer.status] || offer.status;

    return (
        <div className={`${styles.card} ${isOwn ? styles.own : styles.other}`}>
            {offer.targetBookImage && (
                <img src={offer.targetBookImage} alt="" className={styles.image} />
            )}

            <div className={styles.content}>
                <p className={styles.title}>
                    Offered {offer.offeredBookIds?.length || 0} book{offer.offeredBookIds?.length !== 1 ? 's' : ''}
                </p>
                {offer.location && (
                    <p className={styles.location}>
                        📍 {offer.location.title || 'Location TBD'}
                    </p>
                )}

                <div className={styles.footer}>
                    <span
                        className={styles.status}
                        style={{ borderColor: STATUS_COLORS[offer.status] || 'var(--bg-elem)' }}
                    >
                        {statusLabel}
                    </span>

                    {!isOwn && offer.status === NEGOTIATION_STATUS.PENDING && (
                        <div className={styles.actions}>
                            <button
                                className={`${styles.btn} ${styles.accept}`}
                                onClick={() => handleStatus(NEGOTIATION_STATUS.ACCEPTED)}
                                disabled={busy}
                            >
                                <Check size={14} />
                                Accept
                            </button>
                            <button
                                className={`${styles.btn} ${styles.decline}`}
                                onClick={() => handleStatus(NEGOTIATION_STATUS.DECLINED)}
                                disabled={busy}
                            >
                                <X size={14} />
                                Decline
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
