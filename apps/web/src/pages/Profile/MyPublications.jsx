import {useEffect, useState} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {fetchUserPublications} from '@readme/shared/src/services/publications';
import {useAuth} from '@readme/shared/src/contexts/AuthContext/web';
import PublicationCard from '../Map/components/PublicationCard.jsx';
import Spinner from '../../components/Spinner.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import {useToast} from '../../hooks/useToast';
import {WEB_ROUTES} from '../../constants/webRoutes';
import styles from './MyPublications.module.css';

export default function MyPublications() {
    const navigate = useNavigate();
    const location = useLocation();
    const {currentUser} = useAuth();
    const uid = currentUser?.uid;

    const [publications, setPublications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, showToast] = useToast(3000);

    useEffect(() => {
        if (location.state?.toastMessage) {
            showToast(location.state.toastMessage);
            window.history.replaceState({}, document.title);
        }
    }, [location, showToast]);

    useEffect(() => {
        if (!uid) return;
        let cancelled = false;

        async function loadData() {
            try {
                const pubs = await fetchUserPublications(uid);
                if (!cancelled)
                    setPublications(pubs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            } catch (err) {
                console.error('Error loading my publications:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadData();
        return () => cancelled = true;
    }, [uid]);

    if (loading)
        return <Spinner center label="Loading your trades"/>;

    return (
        <div className={styles.page}>
            {toast && <div className={styles.toast}>{toast}</div>}
            <PageHeader onBack={() => navigate(WEB_ROUTES.PROFILE)} title="My Trades"/>

            {publications.length === 0 ? (
                <div className={styles.empty}>
                    <p className={styles.emptyTitle}>No active trades</p>
                    <p className={styles.emptyText}>You haven't listed any books for trade yet.</p>
                    <Button onClick={() => navigate(WEB_ROUTES.PUBLICATION_NEW)}>
                        Create a trade
                    </Button>
                </div>
            ) : (
                <div className={styles.grid}>
                    {publications.map(pub => (
                        <PublicationCard
                            key={pub.id}
                            pub={pub}
                            isFavorite={false}
                            onToggleFavorite={() => {
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}