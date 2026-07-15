import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';
import { PublicationService } from '@readme/shared/src/services/publications';
import { UsersService } from '@readme/shared/src/services/users';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { WEB_ROUTES } from '../../constants/webRoutes';
import UserAvatar from '../../components/UserAvatar.jsx';
import Button from '../../components/Button.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { SkeletonList } from '../../components/Skeleton.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { useToast } from '../../hooks/useToast';
import styles from './PublicationDetails.module.css';

export default function PublicationDetails({ embedded = false, pubId: pubIdProp, onClose }) {
    const { pubId: paramPubId } = useParams();
    const pubId = pubIdProp || paramPubId;
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [toast, showToast] = useToast(3000);

    const [pub, setPub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favBusy, setFavBusy] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [mainImageIndex, setMainImageIndex] = useState(0);

    useEffect(() => {
        if (!pubId) return;
        let cancelled = false;

        (async () => {
            try {
                const [data, profile] = await Promise.all([
                    PublicationService.fetchPublication(pubId),
                    currentUser ? UsersService.fetchUserProfile(currentUser.uid).catch(() => null) : Promise.resolve(null)
                ]);
                if (cancelled) return;
                if (!data) {
                    setNotFound(true);
                    return;
                }
                setPub(data);
                setIsFavorite((profile?.favoriteBooks || []).includes(pubId));
            } catch (err) {
                console.error('Error loading publication:', err);
                if (!cancelled) setNotFound(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [pubId, currentUser?.uid]);

    const isOwner = currentUser && pub && currentUser.uid === pub.uid;

    async function handleToggleFavorite() {
        if (!currentUser || !pub) return;
        setFavBusy(true);
        try {
            await UsersService.toggleFavoriteStatus(currentUser.uid, pub.id, isFavorite);
            setIsFavorite(!isFavorite);
            showToast(isFavorite ? 'Removed from favorites' : 'Added to favorites');
        } catch (err) {
            showToast('Failed to update favorite');
            console.error(err);
        } finally {
            setFavBusy(false);
        }
    }

    async function handleDelete() {
        setDeleting(true);
        try {
            await PublicationService.deletePublication(currentUser, pub.id);
            showToast('Publication deleted');
            if (embedded && onClose) onClose();
            else navigate(WEB_ROUTES.MAP);
        } catch (err) {
            showToast('Failed to delete publication');
            console.error(err);
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    }

    if (loading) return <div className={`${styles.page} ${embedded ? styles.embedded : ''}`}><SkeletonList count={4} /></div>;

    if (notFound) {
        return (
            <div className={styles.page}>
                <PageHeader onBack={() => navigate(-1)} />
                <p className={styles.notFound}>Publication not found.</p>
            </div>
        );
    }

    if (!pub) return null;

    const images = pub.book?.images || [];
    const mainImage = images[mainImageIndex];

    return (
        <div className={`${styles.page} ${embedded ? styles.embedded : ''}`}>
            <ConfirmDialog
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete publication?"
                message="This cannot be undone."
                confirmLabel="Delete"
                danger
                busy={deleting}
            />

            <PageHeader onBack={() => embedded && onClose ? onClose() : navigate(-1)} />

            <div className={styles.container}>
                {/* Gallery */}
                <div className={styles.gallery}>
                    {mainImage && (
                        <div className={styles.mainImage}>
                            <img src={mainImage} alt={pub.book?.title} />
                        </div>
                    )}

                    {images.length > 1 && (
                        <div className={styles.thumbnails}>
                            {images.map((img, i) => (
                                <button
                                    key={i}
                                    className={`${styles.thumb} ${i === mainImageIndex ? styles.thumbActive : ''}`}
                                    onClick={() => setMainImageIndex(i)}
                                >
                                    <img src={img} alt="" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className={styles.info}>
                    <h1 className={styles.title}>{pub.book?.title || 'Untitled'}</h1>
                    <p className={styles.author}>{pub.book?.author || 'Unknown author'}</p>

                    <div className={styles.meta}>
                        {pub.book?.condition && (
                            <div className={styles.metaItem}>
                                <span className={styles.label}>Condition:</span>
                                <span>{pub.book.condition}</span>
                            </div>
                        )}
                        {pub.book?.subject && (
                            <div className={styles.metaItem}>
                                <span className={styles.label}>Subject:</span>
                                <span>{pub.book.subject}</span>
                            </div>
                        )}
                    </div>

                    {pub.detailsText && (
                        <div className={styles.description}>
                            <h3>About this book</h3>
                            <p>{pub.detailsText}</p>
                        </div>
                    )}

                    {/* Seller */}
                    <div className={styles.seller}>
                        <div className={styles.sellerInfo}>
                            <UserAvatar
                                user={{ photoURL: pub.sellerAvatar, username: pub.sellerName }}
                            />
                            <div>
                                <p className={styles.sellerLabel}>Listed by</p>
                                <Link
                                    to={WEB_ROUTES.userProfile(pub.uid)}
                                    className={styles.sellerName}
                                >
                                    {pub.sellerName || 'Anonymous'}
                                </Link>
                            </div>
                        </div>

                        <div className={styles.stats}>
                            <span>❤️ {pub.stats?.likesCount || 0}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={styles.actions}>
                        {!isOwner && (
                            <>
                                <Button
                                    onClick={handleToggleFavorite}
                                    disabled={favBusy}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        backgroundColor: isFavorite ? 'var(--error)' : undefined,
                                    }}
                                >
                                    <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                                    {isFavorite ? 'Favorited' : 'Favorite'}
                                </Button>
                                <Button
                                    className={styles.offerBtn}
                                    onClick={() => navigate(`${WEB_ROUTES.OFFERS_NEW}?pub=${pubId}`)}
                                >
                                    Make an Offer
                                </Button>
                            </>
                        )}

                        {isOwner && (
                            <Button
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={deleting}
                                style={{ backgroundColor: 'var(--error)' }}
                            >
                                <Trash2 size={16} />
                                {deleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
