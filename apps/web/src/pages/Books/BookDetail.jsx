import {useEffect, useRef, useState} from 'react';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import {useAuth} from '@readme/shared/src/contexts/AuthContext/web';
import {myBooksService} from '@readme/shared/src/services/books';
import {getBook} from '@readme/shared/src/services/booksCatalog';
import {UsersService} from '@readme/shared/src/services/users';
import {formatAuthors} from '@readme/shared/src/utils/formatAuthors';
import {BOOK_STATUS, BOOK_STATUS_LABELS} from '@readme/shared/src/constants/bookStatus';
import Spinner from '../../components/Spinner.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import BookCover from '../../components/BookCover.jsx';
import {WEB_ROUTES} from '../../constants/webRoutes.js';
import styles from './BookDetail.module.css';

function StarRating({rating, onRate, disabled}) {
    const [hovered, setHovered] = useState(null);
    const active = hovered ?? rating ?? 0;

    return (
        <div
            className={styles.stars}
            onMouseLeave={() => setHovered(null)}
            role="group"
            aria-label="Your rating"
        >
            {[1, 2, 3, 4, 5].map(n => (
                <button
                    key={n}
                    type="button"
                    className={`${styles.starBtn} ${n <= active ? styles.starFilled : styles.starEmpty}`}
                    onMouseEnter={() => !disabled && setHovered(n)}
                    onClick={() => !disabled && onRate(n === rating ? 0 : n)}
                    disabled={disabled}
                    aria-label={`Rate ${n} star${n !== 1 ? 's' : ''}`}
                >
                    ★
                </button>
            ))}
            {rating > 0 && (
                <span className={styles.ratingLabel}>{rating} / 5</span>
            )}
        </div>
    );
}

function ReadOnlyStars({rating}) {
    const filled = rating ?? 0;
    return (
        <div className={styles.stars} role="img" aria-label={filled ? `${filled} out of 5 stars` : 'Not rated'}>
            {[1, 2, 3, 4, 5].map(n => (
                <span
                    key={n}
                    className={`${styles.starBtn} ${n <= filled ? styles.starFilled : styles.starEmpty}`}
                    style={{cursor: 'default'}}
                >
                    ★
                </span>
            ))}
            {filled > 0 && <span className={styles.ratingLabel}>{filled} / 5</span>}
        </div>
    );
}

export default function BookDetail({ embedded = false, onClose }) {
    const {bookId: paramBookId} = useParams();
    const bookId = paramBookId;
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const {currentUser} = useAuth();
    const uid = currentUser?.uid;

    // If ?owner=<uid> is present and differs from the current user, show read-only view.
    const ownerUid = searchParams.get('owner');
    const isOwnBook = !ownerUid || ownerUid === uid;

    const fromOrigin = searchParams.get('from');

    const [catalog, setCatalog] = useState(null);
    const [myBook, setMyBook] = useState(null);
    const [ownerProfile, setOwnerProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [notes, setNotes] = useState('');
    const [notesSaved, setNotesSaved] = useState(false);
    const [savingNotes, setSavingNotes] = useState(false);
    const notesTimer = useRef(null);

    const [currentPage, setCurrentPage] = useState('');
    const [savingProgress, setSavingProgress] = useState(false);
    const progressTimer = useRef(null);

    useEffect(() => {
        if (!uid || !bookId) return;

        setLoading(true);
        setError(null);
        const targetUid = isOwnBook ? uid : ownerUid;

        Promise.all([
            getBook(bookId),
            myBooksService.getBookData(targetUid, bookId),
            isOwnBook ? Promise.resolve(null) : UsersService.fetchUserProfile(ownerUid).catch(() => null),
        ]).then(([cat, my, owner]) => {
            setCatalog(cat);
            setMyBook(my);
            setOwnerProfile(owner);
            setNotes(my?.notes || '');
            setCurrentPage(my?.currentPage ?? 0);
        }).catch(err => {
            setError(err.message || 'Could not load book.');
        }).finally(() => setLoading(false));
    }, [uid, bookId, ownerUid, isOwnBook]);

    async function handleStatusChange(status) {
        setMyBook(prev => ({...prev, status}));
        try {
            await myBooksService.updateBook(uid, bookId, {status});
        } catch {
            setMyBook(prev => ({...prev, status: myBook?.status}));
        }
    }

    async function handleRate(rating) {
        const newRating = rating === 0 ? null : rating;
        setMyBook(prev => ({...prev, rating: newRating}));
        try {
            await myBooksService.updateBook(uid, bookId, {rating: newRating});
        } catch {
            setMyBook(prev => ({...prev, rating: myBook?.rating}));
        }
    }

    function handleNotesChange(e) {
        const val = e.target.value;
        setNotes(val);
        setNotesSaved(false);
        clearTimeout(notesTimer.current);

        notesTimer.current = setTimeout(async () => {
            setSavingNotes(true);
            try {
                await myBooksService.updateBook(uid, bookId, {notes: val});
                setNotesSaved(true);
                setTimeout(() => setNotesSaved(false), 2000);
            } finally {
                setSavingNotes(false);
            }
        }, 800);
    }

    function handleProgressChange(val) {
        let newPage = val;

        if (val !== '') {
            newPage = parseInt(val, 10);
            if (isNaN(newPage)) return;

            const pageCount = catalog?.pageCount || 0;
            if (pageCount > 0 && newPage > pageCount) newPage = pageCount;
            if (newPage < 0) newPage = 0;
        }

        setCurrentPage(newPage);
        clearTimeout(progressTimer.current);

        progressTimer.current = setTimeout(async () => {
            const finalPage = newPage === '' ? 0 : newPage;
            setSavingProgress(true);

            try {
                const pageCount = catalog?.pageCount || 0;
                const pct = pageCount > 0 ? Math.round((finalPage / pageCount) * 100) : Math.min(finalPage, 100);

                const updates = {currentPage: finalPage, progress: pct};
                let newStatus = status;

                if (pageCount > 0 && finalPage >= pageCount && status !== BOOK_STATUS.DONE) {
                    updates.status = BOOK_STATUS.DONE;
                    newStatus = BOOK_STATUS.DONE;
                } else if (pageCount === 0 && finalPage >= 100 && status !== BOOK_STATUS.DONE) {
                    updates.status = BOOK_STATUS.DONE;
                    newStatus = BOOK_STATUS.DONE;
                }

                await myBooksService.updateBook(uid, bookId, updates);
                setMyBook(prev => ({...prev, currentPage: finalPage, progress: pct, status: newStatus}));
            } finally {
                setSavingProgress(false);
            }
        }, 600);
    }

    const status = myBook?.status || BOOK_STATUS.READING;
    const displayTitle = catalog?.title || myBook?.title || 'Untitled';
    const displayCoverUrl = catalog?.coverUrl || myBook?.coverUrl || null;
    const displayDescription = catalog?.description || null;
    const authors = formatAuthors(catalog?.authors || myBook?.authors || []);

    return (
        <div className={`${styles.page} ${embedded ? styles.embedded : ''}`}>
            <button
                type="button"
                className={styles.backBtn}
                onClick={() => {
                    if (embedded && onClose) {
                        onClose();
                    } else if (fromOrigin === 'chat')
                        navigate(-1);
                    else
                        navigate(isOwnBook ? WEB_ROUTES.BOOKS : -1);
                }}
            >
                <ArrowLeft size={18}/>
                {fromOrigin === 'chat' ? 'Back to Chat' : (isOwnBook ? 'My Books' : 'Back')}
            </button>

            {loading ? (
                <Spinner center label="Loading book"/>
            ) : error ? (
                <ErrorAlert>{error}</ErrorAlert>
            ) : isOwnBook ? (

                <>
                    <div className={styles.hero}>
                        <BookCover
                            coverUrl={displayCoverUrl}
                            imgClassName={styles.cover}
                            placeholderClassName={`${styles.cover} ${styles.coverPlaceholder}`}
                            iconSize={48}
                        />
                        <h1 className={styles.title}>{displayTitle}</h1>
                        {authors && <p className={styles.authors}>{authors}</p>}
                        {displayDescription && (
                            <p className={styles.heroDescription}>{displayDescription}</p>
                        )}
                    </div>

                    <div className={styles.section}>
                        <p className={styles.sectionLabel}>Reading status</p>
                        <div className={styles.statusToggle}>
                            <button type="button"
                                    className={`${styles.statusBtn} ${status === BOOK_STATUS.READING ? styles.statusBtnActive : ''}`}
                                    onClick={() => handleStatusChange(BOOK_STATUS.READING)}>{BOOK_STATUS_LABELS[BOOK_STATUS.READING]}</button>
                            <button type="button"
                                    className={`${styles.statusBtn} ${status === BOOK_STATUS.DONE ? styles.statusBtnActive : ''}`}
                                    onClick={() => handleStatusChange(BOOK_STATUS.DONE)}>{BOOK_STATUS_LABELS[BOOK_STATUS.DONE]}</button>
                            <button type="button"
                                    className={`${styles.statusBtn} ${status === BOOK_STATUS.WANT ? styles.statusBtnActive : ''}`}
                                    onClick={() => handleStatusChange(BOOK_STATUS.WANT)}>{BOOK_STATUS_LABELS[BOOK_STATUS.WANT]}</button>
                        </div>
                    </div>

                    {status === BOOK_STATUS.READING && (
                        <div className={styles.section}>
                            <div className={styles.sectionLabelRow}>
                                <p className={styles.sectionLabel}>Reading progress</p>
                                {savingProgress && <span className={styles.saveStatus}>Saving...</span>}
                            </div>
                            <div className={styles.progressContainer}>
                                <input
                                    type="range"
                                    min="0"
                                    max={catalog?.pageCount || 100}
                                    value={currentPage === '' ? 0 : currentPage}
                                    onChange={(e) => handleProgressChange(e.target.value)}
                                    className={styles.slider}
                                />
                                <div className={styles.progressInputs}>
                                    <input
                                        type="number"
                                        min="0"
                                        max={catalog?.pageCount || undefined}
                                        value={currentPage}
                                        onChange={(e) => handleProgressChange(e.target.value)}
                                        className={styles.pageInput}
                                    />
                                    <span className={styles.pageTotal}>
                                        / {catalog?.pageCount ? `${catalog.pageCount} pages` : (catalog?.pageCount === 0 ? '% (Estimated)' : '? pages')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.section}>
                        <p className={styles.sectionLabel}>Your rating</p>
                        <StarRating rating={myBook?.rating ?? null} onRate={handleRate}/>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionLabelRow}>
                            <p className={styles.sectionLabel}>Your notes</p>
                            {savingNotes && <span className={styles.saveStatus}>Saving…</span>}
                            {notesSaved &&
                                <span className={`${styles.saveStatus} ${styles.saveStatusDone}`}>Saved</span>}
                        </div>
                        <textarea
                            className={styles.textarea}
                            placeholder="What did you think? Any memorable moments, quotes, or thoughts…"
                            value={notes}
                            onChange={handleNotesChange}
                            rows={5}
                        />
                    </div>
                </>
            ) : (

                <>
                    <div className={styles.hero}>
                        <BookCover
                            coverUrl={displayCoverUrl}
                            imgClassName={styles.cover}
                            placeholderClassName={`${styles.cover} ${styles.coverPlaceholder}`}
                            iconSize={48}
                        />
                        <h1 className={styles.title}>{displayTitle}</h1>
                        {authors && <p className={styles.authors}>{authors}</p>}
                        {displayDescription && (
                            <p className={styles.heroDescription}>{displayDescription}</p>
                        )}
                    </div>

                    <div className={styles.section}>
                        <p className={styles.sectionLabel}>Rating</p>
                        {myBook?.rating
                            ? <ReadOnlyStars rating={myBook.rating}/>
                            :
                            <p className={styles.emptyField}>{ownerProfile?.username ? `@${ownerProfile.username}` : 'This user'} hasn&rsquo;t
                                rated this book yet!</p>
                        }
                    </div>

                    <div className={styles.section}>
                        <p className={styles.sectionLabel}>Review</p>
                        {myBook?.notes
                            ? <p className={styles.readOnlyNotes}>{myBook.notes}</p>
                            :
                            <p className={styles.emptyField}>{ownerProfile?.username ? `@${ownerProfile.username}` : 'This user'} hasn&rsquo;t
                                reviewed this book yet.</p>
                        }
                    </div>
                </>
            )}
        </div>
    );
}
