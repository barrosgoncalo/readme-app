import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import BookCover from '../../../components/BookCover.jsx';
import { formatAuthors } from '@readme/shared/src/utils/formatAuthors';
import { WEB_ROUTES } from '../../../constants/webRoutes';
import { PUBLICATION_STATUS } from '@readme/shared/src/constants/status';
import styles from './PublicationCard.module.css';

const STATUS_COLORS = {
    available: 'var(--success)',
    reserved: 'var(--secondary)',
    swapped: 'var(--bg-elem)',
};

export default function PublicationCard({ pub, isFavorite, onToggleFavorite, busy }) {
    if (!pub) return null;

    const authors = formatAuthors(pub.book?.author);
    const coverUrl = pub.book?.images?.[0];
    const statusLabel = {
        [PUBLICATION_STATUS.AVAILABLE]: 'Available',
        [PUBLICATION_STATUS.RESERVED]: 'Reserved',
        [PUBLICATION_STATUS.SWAPPED]: 'Swapped',
    }[pub.status] || pub.status;

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
                        {pub.sellerAvatar ? (
                            <img src={pub.sellerAvatar} alt="" className={styles.avatar} />
                        ) : (
                            <span className={styles.avatarPlaceholder} aria-hidden>
                                {(pub.sellerName || '?').charAt(0).toUpperCase()}
                            </span>
                        )}
                        <span className={styles.sellerName}>{pub.sellerName || 'Anonymous'}</span>
                    </div>

                    <div className={styles.footer}>
                        <span
                            className={styles.status}
                            style={{ borderColor: STATUS_COLORS[pub.status] || 'var(--bg-elem)' }}
                        >
                            {statusLabel}
                        </span>
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
