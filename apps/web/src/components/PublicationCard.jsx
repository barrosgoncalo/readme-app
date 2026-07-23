import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Repeat, User } from 'lucide-react';
import BookCover from './BookCover';
import { formatAuthors } from '@readme/shared/src/utils/formatAuthors';
import { BOOK_GENRES } from '@readme/shared/src/constants/bookOptions';
import { WEB_ROUTES } from '../constants/webRoutes';
import styles from './PublicationCard.module.css';

// Cycle a small set of theme-aware hues across the fixed genre list so each
// genre gets a stable, repeatable color (same genre = same color everywhere).
const GENRE_VARIANTS = ['genreA', 'genreB', 'genreC', 'genreD'];

function genreVariant(genre) {
    const idx = BOOK_GENRES.indexOf(genre);
    return GENRE_VARIANTS[(idx === -1 ? 0 : idx) % GENRE_VARIANTS.length];
}

// Condition maps to a semantic quality tint rather than a rotating color,
// so "Like New" reads as positive and "Poor" reads as a caution.
function conditionVariant(condition) {
    switch (condition) {
        case 'Brand New':
        case 'Like New':
            return 'conditionGreat';
        case 'Good':
            return 'conditionGood';
        case 'Fair':
            return 'conditionFair';
        case 'Poor (Reading Copy)':
            return 'conditionPoor';
        default:
            return 'conditionNeutral';
    }
}

export default function PublicationCard({ pub, isFavorite, onToggleFavorite, onSwap, busy }) {
    const [avatarFailed, setAvatarFailed] = useState(false);

    if (!pub) return null;

    const authors = formatAuthors(pub.book?.author);
    const coverUrl = pub.book?.images?.[0];
    const genre = pub.book?.subject;
    const condition = pub.book?.condition;

    return (
        <Link
            to={WEB_ROUTES.publicationDetail(pub.id)}
            className={styles.card}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div className={styles.coverWrap}>
                <BookCover
                    coverUrl={coverUrl}
                    imgClassName={styles.cover}
                    placeholderClassName={`${styles.cover} ${styles.placeholder}`}
                    iconSize={24}
                />
            </div>

            <div className={styles.body}>
                <div className={styles.content}>
                    <p className={styles.title}>{pub.book?.title || 'Untitled'}</p>
                    <p className={styles.authors}>{authors || 'Unknown author'}</p>
                </div>

                <div className={styles.bottomGroup}>
                    {(genre || (condition && condition !== 'Not specified')) && (
                        <div className={styles.tags}>
                            {genre && (
                                <span className={`${styles.tag} ${styles[genreVariant(genre)]}`}>{genre}</span>
                            )}
                            {condition && condition !== 'Not specified' && (
                                <span className={`${styles.tag} ${styles[conditionVariant(condition)]}`}>
                                    {condition}
                                </span>
                            )}
                        </div>
                    )}

                    <div className={styles.footer}>
                        <div className={styles.seller}>
                            {pub.sellerAvatar && !avatarFailed ? (
                                <img
                                    src={pub.sellerAvatar} 
                                    alt=""
                                    className={styles.avatar}
                                    onError={() => setAvatarFailed(true)}
                                />
                            ) : (
                                <span className={styles.avatarFallback} aria-hidden>
                                <User className={styles.avatarIcon} />
                            </span>
                            )}
                            <div className={styles.sellerInfo}>
                                <span className={styles.sellerName}>{pub.sellerName || 'Anonymous'}</span>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            {onSwap && (
                                <button
                                    className={styles.swapBtn}
                                    onClick={e => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onSwap();
                                    }}
                                    disabled={busy}
                                    title="Propose a swap"
                                >
                                    <Repeat size={16} />
                                </button>
                            )}

                            {onToggleFavorite && (
                                <button
                                    className={`${styles.heartBtn} ${isFavorite ? styles.liked : ''}`}
                                    onClick={e => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onToggleFavorite();
                                    }}
                                    disabled={busy}
                                    title={isFavorite ? 'Unlike' : 'Like'}
                                >
                                    <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
