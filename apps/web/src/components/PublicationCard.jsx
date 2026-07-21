import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Repeat, User } from 'lucide-react';
import BookCover from './BookCover';
import { formatAuthors } from '@readme/shared/src/utils/formatAuthors';
import { WEB_ROUTES } from '../constants/webRoutes';
import styles from './PublicationCard.module.css';

// Rotating pastel palette used when a tag doesn't have an explicit color mapping.
const TAG_PALETTE = ['tagBeige', 'tagGreen', 'tagPurple', 'tagPink', 'tagBlue', 'tagYellow'];

function tagVariant(tag, index) {
    return TAG_PALETTE[index % TAG_PALETTE.length];
}

export default function PublicationCard({ pub, isFavorite, onToggleFavorite, onSwap, busy }) {
    const [avatarFailed, setAvatarFailed] = useState(false);

    if (!pub) return null;

    const authors = formatAuthors(pub.book?.author);
    const coverUrl = pub.book?.images?.[0];
    const tags = pub.tags || pub.book?.genres || [];

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

                {onToggleFavorite && (
                    <button
                        className={styles.bookmarkBtn}
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleFavorite();
                        }}
                        disabled={busy}
                        title={isFavorite ? 'Remove bookmark' : 'Bookmark'}
                    >
                        <Bookmark size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>
                )}
            </div>

            <div className={styles.body}>
                <div className={styles.content}>
                    <p className={styles.title}>{pub.book?.title || 'Untitled'}</p>
                    <p className={styles.authors}>{authors || 'Unknown author'}</p>

                    {tags.length > 0 && (
                        <div className={styles.tags}>
                            {tags.map((tag, i) => (
                                <span key={tag} className={`${styles.tag} ${styles[tagVariant(tag, i)]}`}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

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
                            <span className={styles.sellerStatus}>
                                <span className={styles.statusDot} aria-hidden />
                                {pub.sellerStatus || 'Active recently'}
                            </span>
                        </div>
                    </div>

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
                </div>
            </div>
        </Link>
    );
}