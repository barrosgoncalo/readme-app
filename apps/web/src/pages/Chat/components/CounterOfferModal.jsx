import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { formatAuthors } from '@readme/shared/src/utils/formatAuthors';
import LocationPicker from '../../../components/LocationPicker.jsx';
import BookCover from '../../../components/BookCover.jsx';
import Modal from '../../../components/Modal.jsx';
import Button from '../../../components/Button.jsx';
import offerStyles from './OfferMessage.module.css';
import styles from './CounterOfferModal.module.css';

export default function CounterOfferModal({ open, onClose, offeredBooks, loadingBooks, onSubmit, busy }) {
    const [selectedBookId, setSelectedBookId] = useState(null);
    const [location, setLocation] = useState(null);

    const needsBookChoice = offeredBooks.length > 1;

    useEffect(() => {
        if (!needsBookChoice && offeredBooks.length === 1) {
            setSelectedBookId(offeredBooks[0].id);
        }
    }, [needsBookChoice, offeredBooks]);

    useEffect(() => {
        if (!open) {
            setSelectedBookId(offeredBooks.length === 1 ? offeredBooks[0].id : null);
            setLocation(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const canSubmit = selectedBookId && location && !busy;

    function handleSubmit() {
        const chosenBook = offeredBooks.find(b => b.id === selectedBookId);
        if (!chosenBook || !location) return;
        onSubmit(chosenBook.id, chosenBook.coverUrl || null, location);
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Send Counter Offer"
            footer={
                <Button disabled={!canSubmit} onClick={handleSubmit}>
                    {busy ? 'Sending...' : 'Send Counter Offer'}
                </Button>
            }
        >
            <div className={styles.body}>
                {needsBookChoice && (
                    <section>
                        <h3 className={styles.sectionTitle}>Choose the book you want</h3>
                        <div className={`${offerStyles.modalBody} ${offeredBooks.length > 5 ? offerStyles.grid : offerStyles.list}`}>
                            {loadingBooks ? (
                                <p className={styles.loadingText}>Loading books...</p>
                            ) : (
                                offeredBooks.map(book => {
                                    const isSelected = selectedBookId === book.id;
                                    return (
                                        <div
                                            key={book.id}
                                            className={`${offerStyles.offeredBookItem} ${isSelected ? offerStyles.selectedBook : ''} ${offerStyles.selectable}`}
                                            onClick={() => setSelectedBookId(book.id)}
                                        >
                                            <BookCover
                                                coverUrl={book.coverUrl}
                                                imgClassName={offerStyles.obCover}
                                                placeholderClassName={offerStyles.obPlaceholder}
                                                iconSize={20}
                                            />
                                            <div className={offerStyles.obInfo}>
                                                <p className={offerStyles.obTitle}>{book.title || 'Untitled'}</p>
                                                <p className={offerStyles.obAuthor}>
                                                    {formatAuthors(book.authors) || 'Unknown author'}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <div className={offerStyles.checkIcon}>
                                                    <Check size={20} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>
                )}

                <section>
                    <h3 className={styles.sectionTitle}>Meeting location</h3>
                    <LocationPicker location={location} onLocationChange={setLocation} />
                </section>
            </div>
        </Modal>
    );
}
