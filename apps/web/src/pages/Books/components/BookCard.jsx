import { Heart, Trash2, BookOpen } from 'lucide-react';
import styles from './BookCard.module.css';

export default function BookCard({ book, isFavorite, onToggleFavorite, onRemove, busy }) {
    const authors = Array.isArray(book.authors) ? book.authors.join(', ') : book.authors;

    return (
        <div className={styles.card}>
            {book.coverUrl ? (
                <img src={book.coverUrl} alt="" className={styles.cover} />
            ) : (
                <div className={`${styles.cover} ${styles.placeholder}`} aria-hidden>
                    <BookOpen size={24} />
                </div>
            )}

            <div className={styles.body}>
                <div>
                    <p className={styles.title}>{book.title || 'Untitled'}</p>
                    <p className={styles.authors}>{authors || 'Unknown author'}</p>
                </div>
                <div className={styles.actions}>
                    <button
                        type="button"
                        className={`${styles.iconBtn} ${isFavorite ? styles.favoriteActive : ''}`}
                        onClick={onToggleFavorite}
                        disabled={busy}
                        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        aria-pressed={isFavorite}
                    >
                        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={onRemove}
                        disabled={busy}
                        title="Remove from My Books"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
