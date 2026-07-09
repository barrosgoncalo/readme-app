import { useEffect, useState } from 'react';
import { Check, X, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { ChatService } from '@readme/shared/src/services/chat';
import { submitReview, hasUserReviewed } from '@readme/shared/src/services/reviews';
import { NEGOTIATION_STATUS } from '@readme/shared/src/constants/status';
import VerificationUI from './VerificationUI.jsx';
import ReviewUI from './ReviewUI.jsx';
import LocationMapPreview from './LocationMapPreview.jsx';
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
    const [reviewError, setReviewError] = useState('');
    const [showMap, setShowMap] = useState(false);
    const offer = message.offerDetails;
    const isCompleted = offer?.status === 'completed';

    useEffect(() => {
        if (!isCompleted) return;
        let cancelled = false;
        hasUserReviewed(message.id, currentUserId)
            .then(reviewed => { if (!cancelled) setHasReviewed(reviewed); })
            .catch(err => console.error('Error checking review status:', err));
        return () => { cancelled = true; };
    }, [isCompleted, message.id, currentUserId]);

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
        setReviewError('');
        try {
            await submitReview(message.id, chatId, currentUserId, otherUserId, rating, comment);
            setHasReviewed(true);
        } catch (err) {
            console.error('Error submitting review:', err);
            if (err.message?.includes('already reviewed')) {
                setHasReviewed(true);
            } else {
                setReviewError('Failed to submit review. Please try again.');
            }
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
                    <button
                        type="button"
                        className={styles.locationBtn}
                        onClick={() => setShowMap(s => !s)}
                    >
                        <MapPin size={14} />
                        <span className={styles.locationText}>{offer.location.title || 'Location TBD'}</span>
                        {showMap ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
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

            {showMap && offer.location && (
                <LocationMapPreview location={offer.location} />
            )}

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

            {isCompleted && !hasReviewed && (
                <ReviewUI onSubmit={handleSubmitReview} busy={busy} error={reviewError} />
            )}
        </div>
    );
}
