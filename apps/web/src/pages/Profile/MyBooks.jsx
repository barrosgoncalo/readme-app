import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { PublicationService } from '@readme/shared/src/services/publications';
import { UsersService } from '@readme/shared/src/services/users';
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
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [favoriteBusy, setFavoriteBusy] = useState(null);

    useEffect(() => {
        if (!uid) return;

        let cancelled = false;

        (async () => {
            try {
                const [summaries, profile] = await Promise.all([
                    PublicationService.fetchUserPublications(uid),
                    UsersService.fetchUserProfile(uid).catch(() => null),
                ]);

                if (cancelled) return;
                setPublications(summaries.map(s => s.publicationData));
                setFavoriteIds(new Set(profile?.favoriteBooks || []));
            } catch (err) {
                console.error('Error loading your publications:', err);
                if (!cancelled) setPublications([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [uid]);

    async function handleToggleFavorite(pubId) {
        if (!uid) return;
        setFavoriteBusy(pubId);
        try {
            const isFav = favoriteIds.has(pubId);
            await UsersService.toggleFavoriteStatus(uid, pubId, isFav);
            setFavoriteIds(prev => {
                const next = new Set(prev);
                if (isFav) next.delete(pubId);
                else next.add(pubId);
                return next;
            });
        } catch (err) {
            console.error('Failed to toggle favorite:', err);
        } finally {
            setFavoriteBusy(null);
        }
    }

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
                            isFavorite={favoriteIds.has(pub.id)}
                            onToggleFavorite={() => handleToggleFavorite(pub.id)}
                            busy={favoriteBusy === pub.id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
