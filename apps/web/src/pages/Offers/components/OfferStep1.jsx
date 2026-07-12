import BookCover from '../../../components/BookCover.jsx';
import styles from './OfferStep1.module.css';

export default function OfferStep1({publication, myBooks, selectedBooks, onSelectBook, onSelectAll, onClearSelection}) {
    const allSelected = myBooks.length > 0 && selectedBooks.size === myBooks.length;

    return (
        <div className={styles.step1}>
            <section>
                <h2 className={styles.sectionTitle}>You are requesting</h2>
                <div className={styles.targetBook}>
                    <BookCover
                        coverUrl={publication.book.images?.[0]}
                        imgClassName={styles.targetCover}
                        placeholderClassName={styles.targetCoverPlaceholder}
                        iconSize={28}
                    />
                    <div className={styles.details}>
                        <p className={styles.title}>{publication.book.title}</p>
                        <p className={styles.author}>{publication.book.author}</p>
                        <p className={styles.condition}>Condition: {publication.book.condition}</p>
                    </div>
                </div>
            </section>

            <section>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitleObj}>
                        Select books to offer ({selectedBooks.size} selected)
                    </h2>
                    {myBooks.length > 0 && (
                        <button
                            type="button"
                            className={styles.selectAllBtn}
                            onClick={allSelected ? onClearSelection : onSelectAll}
                        >
                            {allSelected ? 'Deselect All' : 'Select All'}
                        </button>
                    )}
                </div>

                {myBooks.length === 0 ? (
                    <p className={styles.empty}>You don't have any books to offer.</p>
                ) : (
                    <div className={styles.booksGrid}>
                        {myBooks.map(book => (
                            <button
                                key={book.id}
                                className={`${styles.bookCard} ${selectedBooks.has(book.id) ? styles.selected : ''}`}
                                onClick={() => onSelectBook(book.id)}
                            >
                                <BookCover
                                    coverUrl={book.coverUrl}
                                    imgClassName={styles.cover}
                                    placeholderClassName={styles.coverPlaceholder}
                                    iconSize={20}
                                />
                                {selectedBooks.has(book.id) && (
                                    <div className={styles.checkmark}>✓</div>
                                )}
                                <p className={styles.bookTitle}>{book.title}</p>
                            </button>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
