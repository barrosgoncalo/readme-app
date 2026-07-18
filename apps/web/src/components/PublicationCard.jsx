import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import BookCover from './BookCover';
import { formatAuthors } from '@readme/shared/src/utils/formatAuthors';
import { WEB_ROUTES } from '../constants/webRoutes';
import styles from './PublicationCard.module.css';

export default function PublicationCard({ pub, isFavorite, onToggleFavorite, busy }) {
    if (!pub) return null;

    const authors = formatAuthors(pub.book?.author);
    const coverUrl = pub.book?.images?.[0];

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

                    <div className={styles.seller}>
                        <img
                            src={pub.sellerAvatar || '/bookworm.png'}
                            alt=""
                            className={styles.avatar}
                            onError={e => { e.currentTarget.src = '/bookworm.png'; }}
                        />
                        <span className={styles.sellerName}>{pub.sellerName || 'Anonymous'}</span>
                    </div>

                    <div className={styles.footer}>
                        <span className={styles.likeCount}>
                            <Heart size={14} fill="currentColor" /> {pub.stats?.likesCount || 0}
                        </span>
                    </div>
                </div>

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
                        <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>
                )}
            </div>
        </Link>
    );
}
