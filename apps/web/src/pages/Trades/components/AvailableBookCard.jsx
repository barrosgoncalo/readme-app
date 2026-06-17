import { BookOpen } from 'lucide-react';
import Button from '../../../components/Button.jsx';
import styles from './AvailableBookCard.module.css';

export default function AvailableBookCard({ book, ownerName, onRequestTrade, busy, disableRequest }) {
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
                    <p className={styles.owner}>Owned by {ownerName}</p>
                </div>
                <Button
                    onClick={onRequestTrade}
                    disabled={busy || disableRequest}
                    style={{ alignSelf: 'flex-start' }}
                >
                    {disableRequest ? 'Request pending' : 'Request trade'}
                </Button>
            </div>
        </div>
    );
}
