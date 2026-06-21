import { Heart, Trash2, BookOpen, SquarePen } from 'lucide-react';
import styles from './BookCard.module.css';

function Stars({ rating }) {
    const filled = rating ?? 0;
    return (
        <span className={styles.stars} aria-label={filled ? `${filled} out of 5 stars` : 'Not rated'}>
            {[1, 2, 3, 4, 5].map(n => (
                <span key={n} className={n <= filled ? styles.starFilled : styles.starEmpty}>★</span>
            ))}
        </span>
    );
}

const STATUS_COLORS = {
    reading: styles.dotReading,
    want: styles.dotWant,
    done: styles.dotDone,
};

const STATUS_LABELS = {
    reading: 'Reading',
    want: 'Want to read',
    done: 'Finished',
};

export default function BookCard({ book, variant = 'row', isFavorite, onToggleFavorite, onRemove, onEdit, busy }) {
    const authors = Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || '');
    const status = book.status || 'reading';
    const day = book.addedAt ? new Date(book.addedAt).getDate() : null;

    if (variant === 'featured') {
        return (
            <div className={styles.featured}>
                <div className={styles.featuredCoverWrap}>
                    {book.coverUrl ? (
                        <img src={book.coverUrl} alt="" className={styles.featuredCover} />
                    ) : (
                        <div className={`${styles.featuredCover} ${styles.coverPlaceholder}`}>
                            <BookOpen size={28} />
                        </div>
                    )}
                </div>
                <div className={styles.featuredBody}>
                    <p className={styles.featuredTitle}>{book.title || 'Untitled'}</p>
                    <p className={styles.featuredAuthors}>{authors || 'Unknown author'}</p>
                    <Stars rating={book.rating} />
                    <div className={styles.featuredActions}>
                        <span className={styles.statusPill}>
                            <span className={`${styles.dot} ${STATUS_COLORS[status]}`} />
                            {STATUS_LABELS[status]}
                        </span>
                        <div className={styles.iconRow}>
                            <button
                                type="button"
                                className={styles.iconBtn}
                                onClick={onEdit}
                                title="Edit book"
                            >
                                <SquarePen size={16} />
                            </button>
                            <button
                                type="button"
                                className={`${styles.iconBtn} ${isFavorite ? styles.favoriteActive : ''}`}
                                onClick={onToggleFavorite}
                                disabled={busy}
                                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                            </button>
                            <button
                                type="button"
                                className={styles.iconBtn}
                                onClick={onRemove}
                                disabled={busy}
                                title="Remove from shelf"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Row variant
    return (
        <div className={styles.row}>
            {day !== null && <span className={styles.day}>{String(day).padStart(2, '0')}</span>}
            <span
                className={`${styles.dot} ${STATUS_COLORS[status]}`}
                title={STATUS_LABELS[status]}
            />
            <div className={styles.rowInfo}>
                <span className={styles.rowTitle}>{book.title || 'Untitled'}</span>
                {authors && <span className={styles.rowAuthors}>{authors}</span>}
                {book.rating > 0 && <Stars rating={book.rating} />}
            </div>
            {book.coverUrl ? (
                <img src={book.coverUrl} alt="" className={styles.rowThumb} />
            ) : (
                <div className={`${styles.rowThumb} ${styles.coverPlaceholder}`}>
                    <BookOpen size={14} />
                </div>
            )}
            <div className={styles.rowActions}>
                <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={onEdit}
                    title="Edit book"
                >
                    <SquarePen size={16} />
                </button>
                <button
                    type="button"
                    className={`${styles.iconBtn} ${isFavorite ? styles.favoriteActive : ''}`}
                    onClick={onToggleFavorite}
                    disabled={busy}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
                <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={onRemove}
                    disabled={busy}
                    title="Remove from shelf"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
