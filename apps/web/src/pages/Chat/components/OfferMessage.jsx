import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { ChatService } from '@readme/shared/src/services/chat';
import { submitReview } from '@readme/shared/src/services/reviews';
import { NEGOTIATION_STATUS } from '@readme/shared/src/constants/status';
import VerificationUI from './VerificationUI.jsx';
import ReviewUI from './ReviewUI.jsx';
import styles from './OfferMessage.module.css';

const STATUS_COLORS = {
    pending: 'var(--secondary)',
    accepted: 'var(--success)',
    declined: 'var(--error)',
    completed: 'var(--primary)',
    countered: 'var(--bg-elem)',
};

export default function OfferMessage({ message, isOwn, currentUserId, chatId, otherUserId }) {
    const [busy, setBusy] = useState(false);
    const [verificationError, setVerificationError] = useState('');
    const [hasReviewed, setHasReviewed] = useState(false);
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

    async function handleCompleteSwap(code) {
        setBusy(true);
        setVerificationError('');
        try {
            if (code.toUpperCase() !== offer.verificationCode?.toUpperCase()) {
                setVerificationError('Incorrect code. Try again.');
                setBusy(false);
                return;
            }
            await ChatService.completeSwap(chatId, message.id);
        } catch (err) {
            console.error('Error completing swap:', err);
            setVerificationError('Failed to complete swap.');
        } finally {
            setBusy(false);
        }
    }

    async function handleSubmitReview(rating, comment) {
        setBusy(true);
        try {
            await submitReview(message.id, chatId, currentUserId, otherUserId, rating, comment);
            setHasReviewed(true);
        } catch (err) {
            console.error('Error submitting review:', err);
        } finally {
            setBusy(false);
        }
    }

    const statusLabel = {
        [NEGOTIATION_STATUS.PENDING]: 'Pending',
        [NEGOTIATION_STATUS.ACCEPTED]: 'Accepted',
        [NEGOTIATION_STATUS.DECLINED]: 'Declined',
        completed: 'Completed',
        countered: 'Countered',
    }[offer.status] || offer.status;

    const isAccepted = offer.status === NEGOTIATION_STATUS.ACCEPTED;
    const isCompleted = offer.status === 'completed';

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

            {isAccepted && offer.verificationCode && (
                <VerificationUI
                    code={offer.verificationCode}
                    displayerId={offer.verificationDisplayerId}
                    scannerId={offer.verificationScannerId}
                    currentUserId={currentUserId}
                    onComplete={handleCompleteSwap}
                    error={verificationError}
                    busy={busy}
                />
            )}

            {isCompleted && !hasReviewed && !isOwn && (
                <ReviewUI onSubmit={handleSubmitReview} busy={busy} />
            )}
        </div>
    );
}
