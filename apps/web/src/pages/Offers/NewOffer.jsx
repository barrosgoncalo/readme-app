import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { fetchPublicationById } from '@readme/shared/src/services/publications';
import { hydrateMyBooks } from '@readme/shared/src/utils/hydrateMyBooks';
import { ChatService } from '@readme/shared/src/services/chat';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { WEB_ROUTES } from '../../constants/webRoutes';
import Spinner from '../../components/Spinner.jsx';
import BookCover from '../../components/BookCover.jsx';
import OfferStep1 from './components/OfferStep1.jsx';
import OfferStep2 from './components/OfferStep2.jsx';
import styles from './NewOffer.module.css';

export default function NewOffer() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;
    const [searchParams] = useSearchParams();
    const pubId = searchParams.get('pub');

    const [step, setStep] = useState(1);
    const [publication, setPublication] = useState(null);
    const [myBooks, setMyBooks] = useState([]);
    const [selectedBooks, setSelectedBooks] = useState(new Set());
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!uid || !pubId) {
            navigate(WEB_ROUTES.MAP);
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const [pub, books] = await Promise.all([
                    fetchPublicationById(pubId),
                    hydrateMyBooks(uid)
                ]);

                if (cancelled) return;

                if (!pub || pub.uid === uid) {
                    navigate(WEB_ROUTES.MAP);
                    return;
                }

                setPublication(pub);
                setMyBooks(books);
            } catch (err) {
                console.error('Error loading offer data:', err);
                if (!cancelled) navigate(WEB_ROUTES.MAP);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [uid, pubId, navigate]);

    async function handleSubmit() {
        if (!publication || selectedBooks.size === 0 || !location) return;

        setSubmitting(true);
        try {
            const targetBook = {
                id: publication.id,
                title: publication.book.title,
                imageUrl: publication.book.images?.[0]
            };

            const offeredBookIds = Array.from(selectedBooks);
            const chatId = await ChatService.sendInitialOffer(
                uid,
                publication.uid,
                targetBook,
                offeredBookIds,
                location
            );

            navigate(`${WEB_ROUTES.CHAT}?c=${chatId}`);
        } catch (err) {
            console.error('Error sending offer:', err);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <Spinner center label="Loading offer" />;
    if (!publication) return null;

    const canProceed = step === 1 ? selectedBooks.size > 0 : location;
    const canSubmit = canProceed && step === 2;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <button
                    className={styles.backBtn}
                    onClick={() => navigate(WEB_ROUTES.publicationDetail(pubId))}
                    aria-label="Back"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className={styles.title}>New Offer</h1>
                <div className={styles.steps}>Step {step} / 2</div>
            </div>

            <div className={styles.container}>
                {step === 1 ? (
                    <OfferStep1
                        publication={publication}
                        myBooks={myBooks}
                        selectedBooks={selectedBooks}
                        onSelectBook={(bookId) => {
                            const next = new Set(selectedBooks);
                            if (next.has(bookId)) {
                                next.delete(bookId);
                            } else {
                                next.add(bookId);
                            }
                            setSelectedBooks(next);
                        }}
                    />
                ) : (
                    <OfferStep2
                        publication={publication}
                        selectedCount={selectedBooks.size}
                        location={location}
                        onLocationChange={setLocation}
                    />
                )}
            </div>

            <div className={styles.footer}>
                {step > 1 && (
                    <button
                        className={styles.backButton}
                        onClick={() => setStep(1)}
                        disabled={submitting}
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>
                )}

                {step === 1 ? (
                    <button
                        className={styles.nextButton}
                        onClick={() => setStep(2)}
                        disabled={!canProceed || submitting}
                    >
                        Next
                        <ArrowRight size={16} />
                    </button>
                ) : (
                    <button
                        className={styles.submitButton}
                        onClick={handleSubmit}
                        disabled={!canSubmit || submitting}
                    >
                        {submitting ? 'Sending...' : 'Send Offer'}
                    </button>
                )}
            </div>
        </div>
    );
}
