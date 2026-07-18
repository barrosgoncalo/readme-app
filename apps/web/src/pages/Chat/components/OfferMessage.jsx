import { useEffect, useState } from 'react';
import { Ban, Check, ChevronDown, ChevronUp, List, MapPin, Repeat, X } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChatService } from '@readme/shared/src/services/chat';
import { TradeService } from '@readme/shared/src/services/trades';
import { ReviewService } from '@readme/shared/src/services/reviews';
import { getBooksByIds } from '@readme/shared/src/services/booksCatalog';
import { formatAuthors } from '@readme/shared/src/utils/formatAuthors';
import { NEGOTIATION_STATUS } from '@readme/shared/src/constants/status';
import { WEB_ROUTES } from '../../../constants/webRoutes';
import ActionCard from './ActionCard.jsx';
import ReviewUI from './ReviewUI.jsx';
import LocationMapPreview from './LocationMapPreview.jsx';
import CounterOfferModal from './CounterOfferModal.jsx';
import BookCover from '../../../components/BookCover.jsx';
import Spinner from '../../../components/Spinner.jsx';
import Modal from '../../../components/Modal.jsx';
import Button from '../../../components/Button.jsx';
import ConfirmDialog from '../../../components/ConfirmDialog.jsx';
import styles from './OfferMessage.module.css';

const STATUS_COLORS = {
    pending: 'var(--secondary)',
    accepted: 'var(--success)',
    declined: 'var(--error)',
    canceled: 'var(--error)',
    unavailable: 'var(--error)',
    completed: 'var(--primary)',
    countered: 'var(--bg-elem)',
};

export default function OfferMessage({ message, isOwn, currentUserId, chatId, otherUserId }) {
    const navigate = useNavigate();

    const [busy, setBusy] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [reviewError, setReviewError] = useState('');
    const [showMap, setShowMap] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showCounterModal, setShowCounterModal] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const showBooksModal = searchParams.get('offer') === message.id;
    const [fetchedBooks, setFetchedBooks] = useState([]);
    const [loadingBooks, setLoadingBooks] = useState(false);

    const [selectedBookId, setSelectedBookId] = useState(null);
    const [singleBook, setSingleBook] = useState(null);

    const offer = message.offerDetails;
    const isCompleted = offer?.status === 'completed';
    const isCanceled = offer?.status === NEGOTIATION_STATUS.CANCELED;
    const isUnavailable = offer?.status === NEGOTIATION_STATUS.UNAVAILABLE;
    // A cancelled swap can still be reviewed by whichever party didn't cancel.
    const canReview = isCompleted || (isCanceled && offer?.cancelledBy !== currentUserId);

    // The counter-offer book picker uses the snapshot already stored on the
    // offer (id/title/image, captured when it was sent) rather than
    // fetchedBooks/getBooksByIds below — that lookup queries the global
    // books catalog by offer.offeredBookIds, but those ids are actually
    // publication ids, so it always returns empty and left selectedBookId
    // (and therefore the Send button) permanently unset.
    const counterOfferBooks = (offer?.offeredBooks || []).map(b => ({ ...b, coverUrl: b.image }));

    useEffect(() => {
        if (showBooksModal && fetchedBooks.length === 0) {
            let cancelled = false;
            setLoadingBooks(true);

            getBooksByIds(offer.offeredBookIds || [])
                .then(docs => {
                    if (!cancelled) {
                        setFetchedBooks(docs);
                        setLoadingBooks(false);
                    }
                })
                .catch(err => {
                    console.error('Error fetching offered books:', err);
                    if (!cancelled) setLoadingBooks(false);
                });

            return () => cancelled = true;
        }
    }, [showBooksModal, fetchedBooks.length, offer.offeredBookIds]);

    // 1. UPDATED: Using the actual subscription method for real-time review status
    useEffect(() => {
        if (!canReview) return;

        const unsubscribe = ReviewService.subscribeToReviewStatus(
            message.id,
            currentUserId,
            (reviewed) => {
                setHasReviewed(reviewed);
            }
        );

        return () => unsubscribe();
    }, [canReview, message.id, currentUserId]);

    useEffect(() => {
        if (offer?.offeredBookIds?.length === 1 && !singleBook) {
            if (offer.savedOfferedTitle && offer.savedRealOfferedId) {
                setSingleBook({
                    title: offer.savedOfferedTitle,
                    realBookId: offer.savedRealOfferedId
                });
                return;
            }

            // The offer already carries a snapshot of the offered book
            // (title/id) taken when it was sent — offeredBookIds points at
            // the publication, not the global books catalog, so a catalog
            // lookup here would never match. Use the snapshot directly.
            const snapshot = offer.offeredBooks?.[0];
            if (snapshot?.title) {
                setSingleBook({ title: snapshot.title, realBookId: snapshot.id });
                return;
            }

            let cancelled = false;
            const originalId = offer.offeredBookIds[0];

            async function fetchNormalBook() {
                try {
                    const globalBooks = await getBooksByIds([originalId]);
                    if (globalBooks && globalBooks.length > 0 && !cancelled)
                        setSingleBook({ title: globalBooks[0].title, realBookId: globalBooks[0].id });
                } catch (err) {
                    console.error(err);
                }
            }

            fetchNormalBook();
            return () => cancelled = true;
        }
    }, [offer?.offeredBookIds, offer?.offeredBooks, offer?.savedOfferedTitle, offer?.savedRealOfferedId, singleBook]);

    if (!offer) return null;

    async function handleStatus(newStatus) {
        setBusy(true);
        try {
            if (newStatus === NEGOTIATION_STATUS.DECLINED && offer.isSelectionFrom)
                await ChatService.declineOfferAndReofferRemaining(chatId, message, currentUserId, otherUserId);
            else {
                const receiverId = isOwn ? message.senderId : currentUserId;
                const senderId = isOwn ? currentUserId : message.senderId;
                await TradeService.resolveOffer(chatId, message.id, newStatus, {
                    proposerId: senderId,
                    receiverId,
                    targetBookId: offer.targetBookId,
                    finalSelectedBookId: offer.finalSelectedBookId,
                    finalSelectedBookImage: offer.finalSelectedBookImage,
                });
            }
        } catch (err) {
            console.error('Error updating offer:', err);
        } finally {
            setBusy(false);
        }
    }

    async function handleCancelSwap() {
        setBusy(true);
        try {
            await TradeService.cancelSwap(
                chatId,
                message.id,
                offer.targetBookId,
                offer.finalSelectedBookId,
                currentUserId,
            );
        } catch (err) {
            console.error('Error cancelling swap:', err);
        } finally {
            setBusy(false);
            setShowCancelConfirm(false);
        }
    }

    async function handleSendCounter(selectedBookId, selectedBookImage, location) {
        setBusy(true);
        try {
            await ChatService.sendCounterOffer(
                chatId,
                message.id,
                currentUserId,
                offer,
                location,
                selectedBookId,
                selectedBookImage,
            );
            setShowCounterModal(false);
        } catch (err) {
            console.error('Error sending counter offer:', err);
        } finally {
            setBusy(false);
        }
    }

    async function handleSubmitReview(rating, comment) {
        setBusy(true);
        setReviewError('');
        try {
            // Note: Make sure submitReview is exported from your ReviewService!
            await ReviewService.submitReview(message.id, chatId, currentUserId, otherUserId, rating, comment);
            setHasReviewed(true);
        } catch (err) {
            console.error('Error submitting review:', err);
            if (err.message?.includes('already reviewed'))
                setHasReviewed(true);
            else
                setReviewError('Failed to submit review. Please try again.');
        } finally {
            setBusy(false);
        }
    }

    function handleOpenBooks() {
        if (!offer.offeredBookIds || offer.offeredBookIds.length === 0) return;

        setSearchParams(prev => {
            prev.set('offer', message.id);
            return prev;
        });
    }

    function handleCloseBooks() {
        setSearchParams(prev => {
            prev.delete('offer');
            return prev;
        });
        setSelectedBookId(null);
    }

    async function handleProposeSelected() {
        if (!selectedBookId) return;

        const chosenBook = fetchedBooks.find(b => b.id === selectedBookId);
        if (!chosenBook) return;

        setBusy(true);
        try {
            await ChatService.chooseBookFromOffer(
                chatId,
                message,
                chosenBook,
                currentUserId,
                otherUserId,
                chosenBook.id,
                chosenBook.title
            );

            handleCloseBooks();
        } catch (err) {
            console.error('Error sending selection:', err);
        } finally {
            setBusy(false);
        }
    }

    const statusLabel = {
        [NEGOTIATION_STATUS.PENDING]: 'Pending',
        [NEGOTIATION_STATUS.ACCEPTED]: 'Accepted',
        [NEGOTIATION_STATUS.DECLINED]: 'Declined',
        [NEGOTIATION_STATUS.CANCELED]: 'Cancelled',
        [NEGOTIATION_STATUS.UNAVAILABLE]: 'Unavailable',
        completed: 'Completed',
        countered: 'Countered',
    }[offer.status] || offer.status;

    const isAccepted = offer.status === NEGOTIATION_STATUS.ACCEPTED;
    const isPending = offer.status === NEGOTIATION_STATUS.PENDING;
    const hasMultipleOptions = offer.offeredBookIds?.length > 1;

    return (
        <div className={`${styles.card} ${isOwn ? styles.own : styles.other}`}>
            {offer.targetBookImage && (
                <img src={offer.targetBookImage} alt="" className={styles.image} />
            )}

            <div className={styles.content}>

                {offer.offeredBookIds?.length === 1 ? (
                    <p
                        className={`${styles.title} ${styles.clickableTitle}`}
                        onClick={() => {
                            const targetId = offer.savedRealOfferedId || singleBook?.realBookId || offer.offeredBookIds[0];
                            const bookOwnerId = offer.isSelectionFrom
                                ? (isOwn ? otherUserId : currentUserId)
                                : message.senderId;

                            navigate(`${WEB_ROUTES.bookDetail(targetId)}?owner=${bookOwnerId}&from=chat`);
                        }}
                        title={offer.savedOfferedTitle || singleBook?.title || 'Loading book...'}
                    >
                        {offer.isSelectionFrom ? 'Chosen: ' : 'Offered: '}
                        {offer.savedOfferedTitle || singleBook?.title || 'Loading...'}
                    </p>
                ) : (
                    <p className={`${styles.title} ${styles.clickableTitle}`} onClick={handleOpenBooks}>
                        Offered {offer.offeredBookIds?.length || 0} books
                    </p>
                )}

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

                    {!isOwn && isPending && (
                        <div className={styles.actions}>
                            {hasMultipleOptions ? (
                                <button
                                    className={`${styles.btn} ${styles.chooseBtn}`}
                                    onClick={handleOpenBooks}
                                    disabled={busy}
                                >
                                    <List size={14} />
                                    Choose Book
                                </button>
                            ) : (
                                <button
                                    className={`${styles.btn} ${styles.accept}`}
                                    onClick={() => handleStatus(NEGOTIATION_STATUS.ACCEPTED)}
                                    disabled={busy}
                                >
                                    <Check size={14} />
                                    Accept
                                </button>
                            )}

                            <button
                                className={`${styles.btn} ${styles.counter}`}
                                onClick={() => setShowCounterModal(true)}
                                disabled={busy}
                            >
                                <Repeat size={14} />
                                Counter
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

            {isAccepted && (
                <>
                    <ActionCard prompt="Swap accepted!">
                        <p className={styles.mobileNotice}>
                            To complete this trade, open the ReadMe mobile app and use the verification code there.
                        </p>
                    </ActionCard>
                    <button
                        type="button"
                        className={styles.cancelSwapBtn}
                        onClick={() => setShowCancelConfirm(true)}
                        disabled={busy}
                    >
                        <Ban size={14} />
                        Cancel Swap Agreement
                    </button>
                </>
            )}

            {isCanceled && (
                <p className={styles.canceledNotice}>
                    {offer.cancelledBy === currentUserId
                        ? 'You cancelled this swap agreement.'
                        : 'The other user cancelled this swap agreement.'}
                </p>
            )}

            {isUnavailable && (
                <p className={styles.canceledNotice}>This trade is no longer available.</p>
            )}

            {canReview && !hasReviewed && (
                <ReviewUI onSubmit={handleSubmitReview} busy={busy} error={reviewError} />
            )}

            <ConfirmDialog
                open={showCancelConfirm}
                onClose={() => setShowCancelConfirm(false)}
                onConfirm={handleCancelSwap}
                title="Cancel swap agreement?"
                message="The other user will be notified and both books will become available again."
                confirmLabel="Yes, cancel"
                danger
                busy={busy}
            />

            <CounterOfferModal
                open={showCounterModal}
                onClose={() => setShowCounterModal(false)}
                offeredBooks={counterOfferBooks}
                loadingBooks={false}
                onSubmit={handleSendCounter}
                busy={busy}
                sellerUid={otherUserId}
                originalLocation={offer.location}
            />

            <Modal
                open={showBooksModal}
                onClose={handleCloseBooks}
                title={(!isOwn && isPending && hasMultipleOptions) ? 'Choose a book to trade' : 'Offered Books'}
                footer={
                    !isOwn && isPending && hasMultipleOptions ? (
                        <Button disabled={!selectedBookId} onClick={handleProposeSelected}>
                            Choose Book
                        </Button>
                    ) : null
                }
            >
                <div className={`${styles.modalBody} ${fetchedBooks.length > 5 ? styles.grid : styles.list}`}>
                    {loadingBooks ? (
                        <Spinner center label="Loading books..." />
                    ) : (
                        fetchedBooks.map(book => {
                            const isSelected = selectedBookId === book.id;
                            const canSelect = !isOwn && isPending && hasMultipleOptions;

                            return (
                                <div
                                    key={book.id}
                                    className={`${styles.offeredBookItem} ${isSelected ? styles.selectedBook : ''} ${canSelect ? styles.selectable : ''}`}
                                    onClick={() => canSelect && setSelectedBookId(book.id)}
                                >
                                    <BookCover
                                        coverUrl={book.coverUrl}
                                        imgClassName={styles.obCover}
                                        placeholderClassName={styles.obPlaceholder}
                                        iconSize={20}
                                    />
                                    <div className={styles.obInfo}>
                                        <p className={styles.obTitle}>{book.title || 'Untitled'}</p>
                                        <p className={styles.obAuthor}>
                                            {formatAuthors(book.authors) || 'Unknown author'}
                                        </p>
                                        <Link
                                            to={`${WEB_ROUTES.bookDetail(book.id)}?owner=${message.senderId}`}
                                            className={styles.obDetailsLink}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            View details
                                        </Link>
                                    </div>
                                    {isSelected && (
                                        <div className={styles.checkIcon}>
                                            <Check size={20} />
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            </Modal>
        </div>
    );
}
