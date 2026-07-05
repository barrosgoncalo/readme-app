import {useState, useEffect, useRef} from 'react';
import {useParams, useNavigate, useSearchParams} from 'react-router-dom';
import {ArrowLeft, BookOpen, ArrowLeftRight} from 'lucide-react';
import {useAuth} from '@readme/shared/src/contexts/AuthContext/web';
import {myBooksService} from '@readme/shared/src/services/books.web';
import {getBook} from '@readme/shared/src/services/booksCatalog.web';
import Spinner from '../../components/Spinner.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
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

export default function BookDetail() {
    const {bookId} = useParams();
    const navigate = useNavigate();
    const {currentUser} = useAuth();
    const uid = currentUser?.uid;

    const [searchParams] = useSearchParams();
    const ownerUid = searchParams.get('owner') || uid;
    const isMyBook = uid === ownerUid;

    const [catalog, setCatalog] = useState(null);
    const [myBook, setMyBook] = useState(null);
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
        if (!ownerUid || !bookId) return;

        setLoading(true);
        setError(null);

        Promise.all([
            getBook(bookId),
            myBooksService.getBookData(ownerUid, bookId),
        ]).then(([cat, my]) => {
            setCatalog(cat);
            setMyBook(my);
            setNotes(my?.notes || '');
            setCurrentPage(my?.currentPage ?? 0);
        }).catch(err => {
            setError(err.message || 'Could not load book.');
        }).finally(() => setLoading(false));
    }, [ownerUid, bookId]);

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

    async function handleTradeToggle() {
        const next = !myBook?.availableForTrade;
        setMyBook(prev => ({...prev, availableForTrade: next}));
        try {
            await myBooksService.updateBook(uid, bookId, {availableForTrade: next});
        } catch {
            setMyBook(prev => ({...prev, availableForTrade: myBook?.availableForTrade}));
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

                if (pageCount > 0 && finalPage >= pageCount && status !== 'done') {
                    updates.status = 'done';
                    newStatus = 'done';
                } else if (pageCount === 0 && finalPage >= 100 && status !== 'done') {
                    updates.status = 'done';
                    newStatus = 'done';
                }

                await myBooksService.updateBook(uid, bookId, updates);
                setMyBook(prev => ({...prev, currentPage: finalPage, progress: pct, status: newStatus}));
            } finally {
                setSavingProgress(false);
            }
        }, 600);
    }

    function handleBack() {
        if (!isMyBook) {
            navigate(-1);
        } else {
            navigate(WEB_ROUTES.BOOKS);
        }
    }

    const status = myBook?.status || 'reading';
    const availableForTrade = myBook?.availableForTrade ?? false;
    const authors = Array.isArray(catalog?.authors)
        ? catalog.authors.join(', ')
        : (catalog?.authors || '');

    return (
        <div className={styles.page}>
            <button type="button" className={styles.backBtn} onClick={() => handleBack()}>
                <ArrowLeft size={18}/>
                {isMyBook ? 'My Books' : 'Back'}
            </button>

            {loading ? (
                <Spinner center label="Loading book"/>
            ) : error ? (
                <ErrorAlert>{error}</ErrorAlert>
            ) : (
                <>
                    {/* Hero */}
                    <div className={styles.hero}>
                        {catalog?.coverUrl ? (
                            <img src={catalog.coverUrl} alt="" className={styles.cover}/>
                        ) : (
                            <div className={`${styles.cover} ${styles.coverPlaceholder}`}>
                                <BookOpen size={48}/>
                            </div>
                        )}
                        <h1 className={styles.title}>{catalog?.title || 'Untitled'}</h1>
                        {authors && <p className={styles.authors}>{authors}</p>}
                        {catalog?.description && (
                            <p className={styles.heroDescription}>{catalog.description}</p>
                        )}
                    </div>
                    {/* Shows info depending on which profile user is viewing */}
                    {isMyBook ? (
                        <div className="ferramentas-de-edicao">

                        {/* Status toggle */}
                        <div className={styles.section}>
                            <p className={styles.sectionLabel}>Reading status</p>
                            <div className={styles.statusToggle}>
                                <button
                                    type="button"
                                    className={`${styles.statusBtn} ${status === 'reading' ? styles.statusBtnActive : ''}`}
                                    onClick={() => handleStatusChange('reading')}
                                >
                                    Reading
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.statusBtn} ${status === 'done' ? styles.statusBtnActive : ''}`}
                                    onClick={() => handleStatusChange('done')}
                                >
                                    Finished
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.statusBtn} ${status === 'want' ? styles.statusBtnActive : ''}`}
                                    onClick={() => handleStatusChange('want')}
                                >
                                    Want to read
                                </button>
                            </div>
                        </div>

                        {/* Reading Progress */}
                        {status === 'reading' && (
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

                        {/* Trade toggle */}
                        <div className={styles.section}>
                            <p className={styles.sectionLabel}>Trading</p>
                            <button
                                type="button"
                                className={`${styles.tradeToggle} ${availableForTrade ? styles.tradeToggleOn : ''}`}
                                onClick={handleTradeToggle}
                                aria-pressed={availableForTrade}
                            >
                                <span className={styles.tradeToggleIcon}>
                                    <ArrowLeftRight size={16}/>
                                </span>
                                <span className={styles.tradeToggleBody}>
                                    <span className={styles.tradeToggleLabel}>
                                        {availableForTrade ? 'Available for trade' : 'Not available for trade'}
                                    </span>
                                    <span className={styles.tradeToggleSub}>
                                        {availableForTrade
                                            ? 'This book is listed on the Trades page.'
                                            : 'Enable to list this book for others to request.'}
                                    </span>
                                </span>
                                <span className={`${styles.pill} ${availableForTrade ? styles.pillOn : ''}`}>
                                    {availableForTrade ? 'On' : 'Off'}
                                </span>
                            </button>
                        </div>

                        {/* Rating */}
                        <div className={styles.section}>
                            <p className={styles.sectionLabel}>Your rating</p>
                            <StarRating rating={myBook?.rating ?? null} onRate={handleRate}/>
                        </div>

                        {/* Notes */}
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
                        </div>
                    ) : (
                        <div className={styles.visitorSection}>
                            <h3>Owner's Review</h3>
                            {myBook?.rating ? (
                                <div>
                                    <StarRating rating={myBook.rating} disabled={true} />
                                    <p>{myBook.review || "No review provided."}</p>
                                </div>
                            ) : (
                                <p>This user hasn't rated or reviewed this book yet.</p>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
