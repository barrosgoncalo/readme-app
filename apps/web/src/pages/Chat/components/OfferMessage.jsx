import {useEffect, useState} from 'react';
import {Ban, ArrowLeftRight, Book, PartyPopper, CheckCircle, AlertTriangle} from 'lucide-react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {ChatService} from '@readme/shared/src/services/chat';
import {TradeService} from '@readme/shared/src/services/trades';
import {ReviewService} from '@readme/shared/src/services/reviews';
import {getBooksByIds} from '@readme/shared/src/services/booksCatalog';
import {formatAuthors} from '@readme/shared/src/utils/formatAuthors';
import {NEGOTIATION_STATUS} from '@readme/shared/src/constants/status';
import {WEB_ROUTES} from '../../../constants/webRoutes';
import ActionCard from './ActionCard.jsx';
import ReviewUI from './ReviewUI.jsx';
import LocationMapPreview from './LocationMapPreview.jsx';
import CounterOfferModal from './CounterOfferModal.jsx';
import BookCover from '../../../components/BookCover.jsx';
import Spinner from '../../../components/Spinner.jsx';
import Modal from '../../../components/Modal.jsx';
import ConfirmDialog from '../../../components/ConfirmDialog.jsx';
import styles from './OfferMessage.module.css';

export default function OfferMessage({message, isOwn, currentUserId, chatId, otherUserId}) {
    const navigate = useNavigate();

    const [busy, setBusy] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [reviewError, setReviewError] = useState('');
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showCounterModal, setShowCounterModal] = useState(false);
    const [targetImageFailed, setTargetImageFailed] = useState(false);
    const [offeredImageFailed, setOfferedImageFailed] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const showBooksModal = searchParams.get('offer') === message.id;
    const [fetchedBooks, setFetchedBooks] = useState([]);
    const [loadingBooks, setLoadingBooks] = useState(false);

    const [singleBook, setSingleBook] = useState(null);

    const offer = message.offerDetails;
    const isCompleted = offer?.status === 'completed';
    const isCanceled = offer?.status === NEGOTIATION_STATUS.CANCELED;
    const isUnavailable = offer?.status === NEGOTIATION_STATUS.UNAVAILABLE;
    const canReview = isCompleted || (isCanceled && offer?.cancelledBy !== currentUserId);

    const counterOfferBooks = (offer?.offeredBooks || []).map(b => ({...b, coverUrl: b.image}));

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
                setSingleBook({title: snapshot.title, realBookId: snapshot.id});
                return;
            }

            let cancelled = false;
            const originalId = offer.offeredBookIds[0];

            async function fetchNormalBook() {
                try {
                    const globalBooks = await getBooksByIds([originalId]);
                    if (globalBooks && globalBooks.length > 0 && !cancelled)
                        setSingleBook({title: globalBooks[0].title, realBookId: globalBooks[0].id});
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

    function handleTargetBookClick() {
        if (!offer.targetBookId) return;
        navigate(`${WEB_ROUTES.publicationDetail(offer.targetBookId)}?from=chat`);
    }

    function handleOfferedBookClick() {
        if (hasMultipleOptions)
            handleOpenBooks();
        else {
            const targetId = offer.savedRealOfferedId || singleBook?.realBookId || offer.offeredBookIds?.[0] || offer.offeredBooks?.[0]?.id;
            if (!targetId) return;

            navigate(`${WEB_ROUTES.publicationDetail(targetId)}?from=chat`);
        }
    }

    const isPending = offer.status === NEGOTIATION_STATUS.PENDING;
    const isAccepted = offer.status === NEGOTIATION_STATUS.ACCEPTED;
    const isCounterOffer = offer?.isCounter === true;
    const hasMultipleOptions = offer.offeredBookIds?.length > 1;

    let statusBg = 'var(--bg-selected)';
    let statusTextColor = 'var(--secondary)'; // Pending

    if (offer?.status === 'accepted' || offer?.status === 'completed') {
        statusBg = 'var(--success-bg)';
        statusTextColor = 'var(--success)';
    } else if (offer?.status === 'declined' || offer?.status === 'countered' || offer?.status === 'canceled' || offer?.status === 'unavailable') {
        statusBg = 'var(--error-bg)';
        statusTextColor = 'var(--error)';
    }

    const imageToShow = offer?.finalSelectedBookImage || offer?.selectedBookImage || (offer?.offeredBookIds?.length === 1 ? offer.offeredBooks?.[0]?.image : null);

    return (
        <>
            <div
                className={styles.offerCard}
                style={{
                    borderColor: isPending && isCounterOffer ? 'var(--secundary)' : 'var(--border-light, #E5E7EB)',
                    borderWidth: isPending && isCounterOffer ? '2px' : '1px',
                    marginLeft: isOwn ? 'auto' : '0'
                }}
            >
                {/* HEADER */}
                <div className={styles.offerHeader}>
                    <ArrowLeftRight size={18} color="var(--secondary)"/>
                    <span className={styles.offerTitle}>
                        {isCounterOffer ? "Counter Proposal" : "Swap Proposal"}
                    </span>
                </div>

                {/* SIDE-BY-SIDE TRADE CONTAINER */}
                <div className={styles.tradeContainer}>
                    {/* Left Side: Target Book */}
                    <div className={styles.bookColumn}>
                        <span className={styles.bookMiniLabel}>Target Book</span>
                        <div
                            role="button"
                            onClick={handleTargetBookClick}
                            style={{cursor: 'pointer'}}
                            title="View book details"
                        >
                            {offer.targetBookImage && !targetImageFailed ? (
                                <img
                                    src={offer.targetBookImage}
                                    alt="Target Book"
                                    className={styles.tradeBookImage}
                                    onError={() => setTargetImageFailed(true)}
                                />
                            ) : (
                                <div className={`${styles.tradeBookImage} ${styles.placeholderBg}`}>
                                    <Book size={20} color="var(--subtext)"/>
                                </div>
                            )}
                        </div>
                    </div>

                    <ArrowLeftRight size={20} color="var(--subtext)" style={{margin: '0 8px'}}/>

                    {/* Right Side: Offered Book(s) */}
                    <div className={styles.bookColumn}>
                        <span className={styles.bookMiniLabel}>
                            {(isCounterOffer || offer?.offeredBooks?.length === 1) ? "Offered Book" : "Options"}
                        </span>
                        <div
                            onClick={handleOfferedBookClick}
                            style={{cursor: 'pointer'}}
                            title={hasMultipleOptions ? "View options" : "View book details"}
                        >
                            {imageToShow && !offeredImageFailed ? (
                                <img
                                    src={imageToShow}
                                    alt="Offered Book"
                                    className={styles.tradeBookImage}
                                    onError={() => setOfferedImageFailed(true)}
                                />
                            ) : (
                                <div className={`${styles.tradeBookImage} ${styles.placeholderBg}`}>
                                    <span style={{fontSize: '1rem', fontWeight: '700', color: 'var(--text)'}}>
                                        {offer?.offeredBooks?.length || offer?.offeredBookIds?.length || 1}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* LOCATION DETAILS */}
                {offer.location ? (
                    <div className={styles.clickableLocationRow}>
                        <span className={styles.offerText}>
                            Location: <span style={{fontWeight: '600', color: 'var(--text)'}}>
                                {offer.location.title || offer.location.address || 'Location TBD'}
                            </span>
                        </span>
                    </div>
                ) : (
                    <div className={styles.offerText} style={{marginTop: '12px'}}>
                        Location: <span style={{fontWeight: '600', color: 'var(--text)'}}>Not specified</span>
                    </div>
                )}

                {/* MAP PREVIEW NA WEB */}
                {offer.location && (
                    <LocationMapPreview location={offer.location}/>
                )}

                {/* STATUS BADGE */}
                <div className={styles.statusBadge} style={{backgroundColor: statusBg}}>
                    <span className={styles.statusBadgeText} style={{color: statusTextColor}}>
                        {offer.status === NEGOTIATION_STATUS.CANCELED ? 'Canceled' : (offer?.status || 'Pending')}
                    </span>
                </div>

                {/* 3-BUTTON ACTION FLOW (Apenas quem recebe pode agir) */}
                {!isOwn && isPending && (
                    <div className={styles.offerActions}>
                        <button
                            className={`${styles.actionButton} ${styles.declineButton}`}
                            onClick={() => handleStatus(NEGOTIATION_STATUS.DECLINED)}
                            disabled={busy}
                        >
                            Decline
                        </button>

                        <button
                            className={`${styles.actionButton} ${styles.counterBackButton}`}
                            onClick={() => setShowCounterModal(true)}
                            disabled={busy}
                        >
                            Counter
                        </button>

                        {!hasMultipleOptions && (
                            <button
                                className={`${styles.actionButton} ${styles.acceptButton}`}
                                style={{backgroundColor: 'var(--secundary)', color: '#FFFFFF'}}
                                onClick={() => handleStatus(NEGOTIATION_STATUS.ACCEPTED)}
                                disabled={busy}
                            >
                                Accept
                            </button>
                        )}
                    </div>
                )}

                {/* AVISO DA WEB PARA COMPLETAR TROCA */}
                {isAccepted && (
                    <div className={styles.acceptedWorkflowContainer}>
                        <ActionCard prompt="Swap accepted!">
                            <p className={styles.mobileNotice} style={{fontSize: '0.85rem', color: 'var(--subtext)'}}>
                                To complete this trade, open the ReadMe mobile app and use the verification scanner.
                            </p>
                        </ActionCard>
                        <button
                            className={styles.cancelSwapButton}
                            onClick={() => setShowCancelConfirm(true)}
                            disabled={busy}
                        >
                            <Ban size={15} style={{marginRight: '6px'}}/>
                            Cancel Swap Agreement
                        </button>
                    </div>
                )}

                {/* ESTADOS COMPLETOS / CANCELADOS */}
                {isCompleted && (
                    <div className={styles.completedContainer}>
                        <div className={styles.completedHeader}>
                            <PartyPopper size={24} color="#10B981"/>
                            <span className={styles.completedText}>Trade completed!</span>
                        </div>
                    </div>
                )}

                {isCanceled && (
                    <div className={styles.completedContainer}>
                        <div className={styles.completedHeader}>
                            <span className={styles.completedText} style={{color: '#EF4444', fontSize: '0.875rem'}}>
                                {offer.cancelledBy === currentUserId
                                    ? "You cancelled this swap agreement"
                                    : "The other user cancelled this swap agreement"}
                            </span>
                        </div>
                    </div>
                )}

                {isUnavailable && (
                    <div className={styles.completedContainer}>
                        <div className={styles.completedHeader}>
                            <AlertTriangle size={20} color="#EF4444"/>
                            <span className={styles.completedText} style={{color: '#EF4444', fontSize: '0.875rem'}}>
                                This trade is no longer available
                            </span>
                        </div>
                    </div>
                )}

                {/* REVIEW UI INLINE DA WEB */}
                {canReview && !hasReviewed && (
                    <div style={{
                        marginTop: '16px',
                        width: '100%',
                        borderTop: '1px solid var(--border-light)',
                        paddingTop: '16px'
                    }}>
                        <ReviewUI onSubmit={handleSubmitReview} busy={busy} error={reviewError}/>
                    </div>
                )}
                {canReview && hasReviewed && (
                    <div className={styles.completedContainer} style={{marginTop: 0, borderTop: 'none'}}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            color: 'var(--subtext)',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                        }}>
                            <CheckCircle size={18} color="#10B981" style={{marginRight: '8px'}}/>
                            Review Submitted
                        </div>
                    </div>
                )}
            </div>

            {/* MODAIS DA WEB (Mantidos inalterados!) */}
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
                title="Offered Books"
            >
                <div className={`${styles.modalBody} ${(counterOfferBooks.length || fetchedBooks.length) > 5 ? styles.grid : styles.list}`}>
                    {loadingBooks && fetchedBooks.length === 0 && counterOfferBooks.length === 0 ? (
                        <Spinner center label="Loading books..." />
                    ) : (
                        (counterOfferBooks.length > 0 ? counterOfferBooks : fetchedBooks).map(book => (
                            <div
                                key={book.id}
                                className={`${styles.offeredBookItem} ${styles.selectable}`}
                                onClick={() => {
                                    navigate(`${WEB_ROUTES.publicationDetail(book.id)}?from=chat`);
                                }}
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
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Modal>
        </>
    );
}
