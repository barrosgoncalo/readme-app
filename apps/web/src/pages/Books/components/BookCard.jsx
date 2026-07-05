import {useState} from 'react';
import {Heart, Trash2, BookOpen, SquarePen} from 'lucide-react';
import styles from './BookCard.module.css';

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

function StarRating({rating, onRate, size = 'md', disabled}) {
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
                    onClick={() => !disabled && onRate(n === rating ? 0 : n)}
                    disabled={disabled}
                    aria-label={`Rate ${n} star${n !== 1 ? 's' : ''}`}
                >
                    ★
                </button>
            ))}
        </div>
    );
}

export default function BookCard({
                                     book,
                                     variant = 'row',
                                     isFavorite,
                                     onToggleFavorite,
                                     onRemove,
                                     onRate,
                                     onEdit,
                                     busy
                                 }) {
    const authors = Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || '');
    const status = book.status || 'reading';
    const day = book.addedAt ? new Date(book.addedAt).getDate() : null;

    if (variant === 'featured') {
        return (
            <div className={styles.featured}>
                <div className={styles.featuredCoverWrap}>
                    {book.coverUrl ? (
                        <img src={book.coverUrl} alt="" className={styles.featuredCover}/>
                    ) : (
                        <div className={`${styles.featuredCover} ${styles.coverPlaceholder}`}>
                            <BookOpen size={28}/>
                        </div>
                    )}
                </div>
                <div className={styles.featuredBody}>
                    <p className={styles.featuredTitle} onClick={onEdit} title="View details">
                        {book.title || 'Untitled'}
                    </p>                    <p className={styles.featuredAuthors}>{authors || 'Unknown author'}</p>
                    <StarRating rating={book.rating} onRate={onRate} size="md" disabled={busy}/>
                    {typeof book.progress === 'number' && (
                        <div className={styles.progressWrap}>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{width: `${book.progress}%`}}/>
                            </div>
                            <span className={styles.progressLabel}>{book.progress}%</span>
                        </div>
                    )}
                    <div className={styles.featuredActions}>
                        <span className={styles.statusPill}>
                            <span className={`${styles.dot} ${STATUS_COLORS[status]}`}/>
                            {STATUS_LABELS[status]}
                        </span>
                        <div className={styles.iconRow}>
                            <button
                                type="button"
                                className={styles.iconBtn}
                                onClick={onEdit}
                                title="Edit book"
                            >
                                <SquarePen size={16}/>
                            </button>
                            <button
                                type="button"
                                className={`${styles.iconBtn} ${isFavorite ? styles.favoriteActive : ''}`}
                                onClick={onToggleFavorite}
                                disabled={busy}
                                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'}/>
                            </button>
                            <button
                                type="button"
                                className={styles.iconBtn}
                                onClick={onRemove}
                                disabled={busy}
                                title="Remove from shelf"
                            >
                                <Trash2 size={16}/>
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
                <span className={styles.rowTitle} onClick={onEdit} title="View details">
                    {book.title || 'Untitled'}
                </span>
                <StarRating rating={book.rating} onRate={onRate} size="sm" disabled={busy}/>
            </div>
            {book.coverUrl ? (
                <img src={book.coverUrl} alt="" className={styles.rowThumb}/>
            ) : (
                <div className={`${styles.rowThumb} ${styles.coverPlaceholder}`}>
                    <BookOpen size={14}/>
                </div>
            )}
            <div className={styles.rowActions}>
                <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={onEdit}
                    title="Edit book"
                >
                    <SquarePen size={16}/>
                </button>
                <button
                    type="button"
                    className={`${styles.iconBtn} ${isFavorite ? styles.favoriteActive : ''}`}
                    onClick={onToggleFavorite}
                    disabled={busy}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'}/>
                </button>
                <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={onRemove}
                    disabled={busy}
                    title="Remove from shelf"
                >
                    <Trash2 size={16}/>
                </button>
            </div>
        </div>
    );
}
