import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { fetchPublicationById } from '@readme/shared/src/services/publications';
import { fetchUserProfile, toggleFavoriteStatus } from '@readme/shared/src/services/users';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { WEB_ROUTES } from '../../constants/webRoutes';
import PublicationCard from '../Map/components/PublicationCard.jsx';
import Spinner from '../../components/Spinner.jsx';
import styles from './Favorites.module.css';

export default function Favorites() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;

    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [favoriteBusy, setFavoriteBusy] = useState(null);

    useEffect(() => {
        if (!uid) return;

        let cancelled = false;

        (async () => {
            try {
                const profile = await fetchUserProfile(uid);
                if (cancelled) return;

                const favIds = profile?.favoriteBooks || [];

                // Fetch all publication docs
                const pubs = await Promise.all(
                    favIds.map(id => fetchPublicationById(id))
                );

                if (!cancelled) {
                    setFavorites(pubs.filter(p => p !== null));
                }
            } catch (err) {
                console.error('Error loading favorites:', err);
                if (!cancelled) setFavorites([]);
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
            await toggleFavoriteStatus(uid, pubId, true);
            setFavorites(prev => prev.filter(p => p.id !== pubId));
        } catch (err) {
            console.error('Failed to remove favorite:', err);
        } finally {
            setFavoriteBusy(null);
        }
    }

    if (loading) return <Spinner center label="Loading favorites" />;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <button
                    className={styles.backBtn}
                    onClick={() => navigate(WEB_ROUTES.PROFILE)}
                    aria-label="Back"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className={styles.title}>Favorites</h1>
            </div>

            {favorites.length === 0 ? (
                <p className={styles.empty}>You haven't added any favorites yet.</p>
            ) : (
                <div className={styles.grid}>
                    {favorites.map(pub => (
                        <PublicationCard
                            key={pub.id}
                            pub={pub}
                            isFavorite={true}
                            onToggleFavorite={() => handleToggleFavorite(pub.id)}
                            busy={favoriteBusy === pub.id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
