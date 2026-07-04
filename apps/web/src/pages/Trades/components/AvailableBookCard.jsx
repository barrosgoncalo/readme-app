import BookCover from '../../../components/BookCover.jsx';
import Button from '../../../components/Button.jsx';
import { formatAuthors } from '@readme/shared/src/utils/formatAuthors';
import styles from './AvailableBookCard.module.css';

export default function AvailableBookCard({ book, ownerName, onRequestTrade, busy, disableRequest }) {
    const authors = formatAuthors(book.authors);

    return (
        <div className={styles.card}>
            <BookCover
                coverUrl={book.coverUrl}
                imgClassName={styles.cover}
                placeholderClassName={`${styles.cover} ${styles.placeholder}`}
                iconSize={24}
            />

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
