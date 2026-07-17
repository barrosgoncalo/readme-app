import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { PublicationService } from '@readme/shared/src/services/publications';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { WEB_ROUTES } from '../../constants/webRoutes';
import PublicationCard from '../Map/components/PublicationCard.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { SkeletonGrid } from '../../components/Skeleton.jsx';
import styles from './MyBooks.module.css';

export default function MyBooks() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;

    const [publications, setPublications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) return;

        let cancelled = false;

        (async () => {
            try {
                const summaries = await PublicationService.fetchUserPublications(uid);
                if (cancelled) return;
                setPublications(summaries.map(s => s.publicationData));
            } catch (err) {
                console.error('Error loading your publications:', err);
                if (!cancelled) setPublications([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [uid]);

    return (
        <div className={styles.page}>
            <PageHeader onBack={() => navigate(WEB_ROUTES.PROFILE)} title="My Books" />

            {loading ? (
                <SkeletonGrid count={6} />
            ) : publications.length === 0 ? (
                <EmptyState
                    icon={BookOpen}
                    title="No books listed yet"
                    message="You haven't listed any books for trade yet."
                    actionLabel="Create a publication"
                    onAction={() => navigate(WEB_ROUTES.PUBLICATION_NEW)}
                />
            ) : (
                <div className={styles.grid}>
                    {publications.map(pub => (
                        <PublicationCard
                            key={pub.id}
                            pub={pub}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
