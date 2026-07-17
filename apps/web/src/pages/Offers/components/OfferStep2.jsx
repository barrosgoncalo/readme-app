import BookCover from '../../../components/BookCover.jsx';
import LocationPicker from '../../../components/LocationPicker.jsx';
import styles from './OfferStep2.module.css';

export default function OfferStep2({ publication, selectedCount, location, onLocationChange }) {
    return (
        <div className={styles.step2}>
            <section className={styles.targetSection}>
                <h2 className={styles.sectionTitle}>Offering {selectedCount} book(s) for</h2>
                <div className={styles.targetBook}>
                    <BookCover
                        coverUrl={publication.book.images?.[0]}
                        imgClassName={styles.cover}
                        placeholderClassName={styles.coverPlaceholder}
                        iconSize={28}
                    />
                    <div className={styles.details}>
                        <p className={styles.title}>{publication.book.title}</p>
                        <p className={styles.author}>{publication.book.author}</p>
                    </div>
                </div>
            </section>

            <section className={styles.locationSection}>
                <h2 className={styles.sectionTitle}>Meeting location</h2>
                <LocationPicker location={location} onLocationChange={onLocationChange} />
            </section>
        </div>
    );
}
