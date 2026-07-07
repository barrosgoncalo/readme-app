import { useState } from 'react';
import { Heart, Trash2, SquarePen } from 'lucide-react';
import { BOOK_STATUS, BOOK_STATUS_LABELS } from '@readme/shared/src/constants/bookStatus';
import { formatAuthors } from '@readme/shared/src/utils/formatAuthors';
import BookCover from '../../../components/BookCover.jsx';
import styles from './BookCard.module.css';

const STATUS_COLORS = {
    [BOOK_STATUS.READING]: styles.dotReading,
    [BOOK_STATUS.WANT]: styles.dotWant,
    [BOOK_STATUS.DONE]: styles.dotDone,
};

function StarRating({ rating, onRate, size = 'md', disabled }) {
    const [hovered, setHovered] = useState(null);
    const active = hovered ?? rating ?? 0;

    return (
        <div
            className={`${styles.stars} ${styles[`stars_${size}`]}`}
            onMouseLeave={() => setHovered(null)}
            role="group"
            aria-label="Rating"
        >
            {[1, 2, 3, 4, 5].map(n => (
                <button
                    key={n}
                    type="button"
                    className={`${styles.starBtn} ${n <= active ? styles.starFilled : styles.starEmpty}`}
                    onMouseEnter={() => !disabled && setHovered(n)}
                    onClick={() => !disabled && onRate?.(n === rating ? 0 : n)}
                    disabled={disabled}
                    aria-label={`Rate ${n} star${n !== 1 ? 's' : ''}`}
                >
                    ★
                </button>
            ))}
        </div>
    );
}

export default function BookCard({ book, variant = 'row', isFavorite, onToggleFavorite, onRemove, onRate, onEdit, busy }) {
    const authors = formatAuthors(book.authors);
    const status = book.status || BOOK_STATUS.READING;
    const day = book.addedAt ? new Date(book.addedAt).getDate() : null;

    if (variant === 'featured') {
        return (
            <div className={styles.featured}>
                <div className={styles.featuredCoverWrap}>
                    <BookCover
                        coverUrl={book.coverUrl}
                        imgClassName={styles.featuredCover}
                        placeholderClassName={`${styles.featuredCover} ${styles.coverPlaceholder}`}
                        iconSize={28}
                    />
                </div>
                <div className={styles.featuredBody}>
                    <p className={styles.featuredTitle} onClick={onEdit} title="View details">
                        {book.title || 'Untitled'}
                    </p>
                    <p className={styles.featuredAuthors}>{authors || 'Unknown author'}</p>
                    <StarRating rating={book.rating} onRate={onRate} size="md" disabled={busy} />
                    {typeof book.progress === 'number' && (
                        <div className={styles.progressWrap}>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${book.progress}%` }} />
                            </div>
                            <span className={styles.progressLabel}>{book.progress}%</span>
                        </div>
                    )}
                    <div className={styles.featuredActions}>
                        <span className={styles.statusPill}>
                            <span className={`${styles.dot} ${STATUS_COLORS[status]}`} />
                            {BOOK_STATUS_LABELS[status]}
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
                title={BOOK_STATUS_LABELS[status]}
            />
            <div className={styles.rowInfo}>
                <span className={styles.rowTitle} onClick={onEdit} title="View details">
                    {book.title || 'Untitled'}
                </span>
                {authors && <span className={styles.rowAuthors}>{authors}</span>}
                <StarRating rating={book.rating} onRate={onRate} size="sm" disabled={busy} />
            </div>
            <BookCover
                coverUrl={book.coverUrl}
                imgClassName={styles.rowThumb}
                placeholderClassName={`${styles.rowThumb} ${styles.coverPlaceholder}`}
                iconSize={14}
            />
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
