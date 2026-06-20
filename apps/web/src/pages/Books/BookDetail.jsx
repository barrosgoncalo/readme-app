import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { myBooksService } from '@readme/shared/src/services/books.web';
import { getBook } from '@readme/shared/src/services/booksCatalog.web';
import Spinner from '../../components/Spinner.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import { WEB_ROUTES } from '../../constants/webRoutes.js';
import styles from './BookDetail.module.css';

function StarRating({ rating, onRate, disabled }) {
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
    const { bookId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;

    const [catalog, setCatalog] = useState(null);
    const [myBook, setMyBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [notes, setNotes] = useState('');
    const [notesSaved, setNotesSaved] = useState(false);
    const [savingNotes, setSavingNotes] = useState(false);
    const notesTimer = useRef(null);

    useEffect(() => {
        if (!uid || !bookId) return;
        setLoading(true);
        setError(null);
        Promise.all([
            getBook(bookId),
            myBooksService.getBookData(uid, bookId),
        ]).then(([cat, my]) => {
            setCatalog(cat);
            setMyBook(my);
            setNotes(my?.notes || '');
        }).catch(err => {
            setError(err.message || 'Could not load book.');
        }).finally(() => setLoading(false));
    }, [uid, bookId]);

    async function handleStatusChange(status) {
        setMyBook(prev => ({ ...prev, status }));
        try {
            await myBooksService.updateBook(uid, bookId, { status });
        } catch {
            setMyBook(prev => ({ ...prev, status: myBook?.status }));
        }
    }

    async function handleRate(rating) {
        const newRating = rating === 0 ? null : rating;
        setMyBook(prev => ({ ...prev, rating: newRating }));
        try {
            await myBooksService.updateBook(uid, bookId, { rating: newRating });
        } catch {
            setMyBook(prev => ({ ...prev, rating: myBook?.rating }));
        }
    }

    async function handleTradeToggle() {
        const next = !myBook?.availableForTrade;
        setMyBook(prev => ({ ...prev, availableForTrade: next }));
        try {
            await myBooksService.updateBook(uid, bookId, { availableForTrade: next });
        } catch {
            setMyBook(prev => ({ ...prev, availableForTrade: myBook?.availableForTrade }));
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
                await myBooksService.updateBook(uid, bookId, { notes: val });
                setNotesSaved(true);
                setTimeout(() => setNotesSaved(false), 2000);
            } finally {
                setSavingNotes(false);
            }
        }, 800);
    }

    const status = myBook?.status || 'reading';
    const availableForTrade = myBook?.availableForTrade ?? false;
    const authors = Array.isArray(catalog?.authors)
        ? catalog.authors.join(', ')
        : (catalog?.authors || '');

    return (
        <div className={styles.page}>
            <button type="button" className={styles.backBtn} onClick={() => navigate(WEB_ROUTES.BOOKS)}>
                <ArrowLeft size={18} />
                My Books
            </button>

            {loading ? (
                <Spinner center label="Loading book" />
            ) : error ? (
                <ErrorAlert>{error}</ErrorAlert>
            ) : (
                <>
                    {/* Hero */}
                    <div className={styles.hero}>
                        {catalog?.coverUrl ? (
                            <img src={catalog.coverUrl} alt="" className={styles.cover} />
                        ) : (
                            <div className={`${styles.cover} ${styles.coverPlaceholder}`}>
                                <BookOpen size={48} />
                            </div>
                        )}
                        <h1 className={styles.title}>{catalog?.title || 'Untitled'}</h1>
                        {authors && <p className={styles.authors}>{authors}</p>}
                        {catalog?.description && (
                            <p className={styles.heroDescription}>{catalog.description}</p>
                        )}
                    </div>

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
                                <ArrowLeftRight size={16} />
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
                        <StarRating rating={myBook?.rating ?? null} onRate={handleRate} />
                    </div>

                    {/* Notes */}
                    <div className={styles.section}>
                        <div className={styles.sectionLabelRow}>
                            <p className={styles.sectionLabel}>Your notes</p>
                            {savingNotes && <span className={styles.saveStatus}>Saving…</span>}
                            {notesSaved && <span className={`${styles.saveStatus} ${styles.saveStatusDone}`}>Saved</span>}
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
            )}
        </div>
    );
}
