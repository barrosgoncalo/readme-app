import { useState } from 'react';
import { Heart, Trash2, SquarePen } from 'lucide-react';
import { BOOK_STATUS, BOOK_STATUS_LABELS } from '@readme/shared/src/constants/bookStatus';
import { formatAuthors } from '@readme/shared/src/utils/formatAuthors';
import { coverColorFor } from '../../../utils/generatedCover.js';
import styles from './BookCard.module.css';

const STATUS_COLORS = {
    [BOOK_STATUS.READING]: styles.dotReading,
    [BOOK_STATUS.WANT]: styles.dotWant,
    [BOOK_STATUS.DONE]: styles.dotDone,
};

function StarRating({ rating, onRate, size = 'md', disabled }) {
    const [hovered, setHovered] = useState(null);
    const isReadOnly = !onRate;
    const active = isReadOnly ? rating ?? 0 : (hovered ?? rating ?? 0);

    return (
        <div
            className={`${styles.stars} ${styles[`stars_${size}`]}`}
            onMouseLeave={() => !isReadOnly && setHovered(null)}
            role={isReadOnly ? 'img' : 'group'}
            aria-label={isReadOnly ? (rating ? `${rating} out of 5 stars` : 'Not rated') : 'Rating'}
        >
            {[1, 2, 3, 4, 5].map(n => (
                isReadOnly ? (
                    <span
                        key={n}
                        className={`${styles.starReadOnly} ${n <= active ? styles.starFilled : styles.starEmpty}`}
                    >
                        ★
                    </span>
                ) : (
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
                )
            ))}
        </div>
    );
}

// Cover image, or a generated cloth cover (title/author typeset on a
// title-hashed color) when there's no usable cover image. Some cover URLs
// (e.g. Open Library's ISBN lookup without ?default=false) resolve to a
// broken or suspiciously tiny placeholder rather than failing outright, so
// both onError and an undersized-image check fall back to the generated
// cover too.
function CoverArt({ book, authors, imgClassName, generatedClassName, titleClassName, authorClassName }) {
    const [imgFailed, setImgFailed] = useState(false);

    if (book.coverUrl && !imgFailed) {
        return (
            <img
                src={book.coverUrl}
                alt=""
                className={imgClassName}
                onError={() => setImgFailed(true)}
                onLoad={(e) => {
                    if (e.target.naturalWidth > 0 && e.target.naturalWidth < 10) {
                        setImgFailed(true);
                    }
                }}
            />
        );
    }

    return (
        <div className={generatedClassName} style={{ backgroundColor: coverColorFor(book.title || '') }}>
            {titleClassName && <span className={titleClassName}>{book.title || 'Untitled'}</span>}
            {authorClassName && <span className={authorClassName}>{authors || 'Unknown author'}</span>}
        </div>
    );
}

// The cover-as-object: image or generated cloth cover, spine highlight,
// status corner dot, hover-revealed favorite/remove actions, and a reading
// progress bar hugging the bottom edge.
function CoverFrame({ book, authors, status, isFavorite, onToggleFavorite, onRemove, busy }) {
    const showProgress = status === BOOK_STATUS.READING && typeof book.progress === 'number';
    const stop = (e) => e.stopPropagation();

    return (
        <div className={styles.coverFrame}>
            <CoverArt
                book={book}
                authors={authors}
                imgClassName={styles.gridCover}
                generatedClassName={styles.generatedCover}
                titleClassName={styles.generatedTitle}
                authorClassName={styles.generatedAuthor}
            />

            <span className={styles.spine} aria-hidden="true" />

            <span
                className={`${styles.cornerDot} ${STATUS_COLORS[status]}`}
                title={BOOK_STATUS_LABELS[status]}
            />

            <div className={styles.hoverActions} onClick={stop}>
                {/*<button*/}
                {/*    type="button"*/}
                {/*    className={`${styles.coverBtn} ${isFavorite ? styles.favoriteActive : ''}`}*/}
                {/*    onClick={onToggleFavorite}*/}
                {/*    disabled={busy}*/}
                {/*    title={isFavorite ? 'Remove from liked books' : 'Add to liked books'}*/}
                {/*>*/}
                {/*    <Heart size={15} fill={isFavorite ? 'currentColor' : 'none'} />*/}
                {/*</button>*/}
                <button
                    type="button"
                    className={styles.coverBtn}
                    onClick={onRemove}
                    disabled={busy}
                    title="Remove from shelf"
                >
                    <Trash2 size={15} />
                </button>
            </div>

            {showProgress && (
                <div className={styles.coverProgress}>
                    <div className={styles.coverProgressFill} style={{ width: `${book.progress}%` }} />
                </div>
            )}
        </div>
    );
}

export default function BookCard({ book, variant = 'row', isFavorite, isSelected, onToggleFavorite, onRemove, onRate, onEdit, busy }) {
    const authors = formatAuthors(book.authors);
    const status = book.status || BOOK_STATUS.READING;
    const day = book.addedAt ? new Date(book.addedAt).getDate() : null;

    const cardKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onEdit?.();
        }
    };

    if (variant === 'grid') {
        return (
            <div
                className={`${styles.gridCard} ${isSelected ? styles.gridSelected : ''}`}
                onClick={onEdit}
                role="button"
                tabIndex={0}
                onKeyDown={cardKeyDown}
            >
                <CoverFrame
                    book={book}
                    authors={authors}
                    status={status}
                    isFavorite={isFavorite}
                    onToggleFavorite={onToggleFavorite}
                    onRemove={onRemove}
                    busy={busy}
                />
                <p className={styles.gridTitle}>{book.title || 'Untitled'}</p>
                <p className={styles.gridAuthors}>{authors || 'Unknown author'}</p>
            </div>
        );
    }

    if (variant === 'featured') {
        return (
            <div className={styles.featured}>
                <div className={styles.featuredCoverWrap}>
                    <CoverArt
                        book={book}
                        authors={authors}
                        imgClassName={styles.featuredCover}
                        generatedClassName={`${styles.featuredCover} ${styles.generatedCoverSmall}`}
                        titleClassName={styles.generatedTitleSmall}
                        authorClassName={styles.generatedAuthorSmall}
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
                            {/*<button*/}
                            {/*    type="button"*/}
                            {/*    className={`${styles.iconBtn} ${isFavorite ? styles.favoriteActive : ''}`}*/}
                            {/*    onClick={onToggleFavorite}*/}
                            {/*    disabled={busy}*/}
                            {/*    title={isFavorite ? 'Remove from liked books' : 'Add to liked books'}*/}
                            {/*>*/}
                            {/*    <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />*/}
                            {/*</button>*/}
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
            <CoverArt
                book={book}
                authors={authors}
                imgClassName={styles.rowThumb}
                generatedClassName={`${styles.rowThumb} ${styles.generatedCoverTiny}`}
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
                    title={isFavorite ? 'Remove from liked books' : 'Add to liked books'}
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
