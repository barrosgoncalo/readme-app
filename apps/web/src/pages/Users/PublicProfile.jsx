import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, UserCheck, Ban, Flag } from 'lucide-react';
import { UsersService } from '@readme/shared/src/services/users';
import { ReviewService } from '@readme/shared/src/services/reviews';
import { MyBooksService } from '@readme/shared/src/services/books';
import { PublicationService } from '@readme/shared/src/services/publications';
import { ReportsService } from '@readme/shared/src/services/reports';
import { REPORT_TARGET_TYPE } from '@readme/shared/src/constants/status';
import { hydrateMyBooks } from '@readme/shared/src/utils/hydrateMyBooks';
import { doBlockUser, doIsBlocked } from '@readme/shared/src/services/block';
import { formatAuthors } from '@readme/shared/src/utils/formatAuthors';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { WEB_ROUTES } from '../../constants/webRoutes';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { SkeletonGrid } from '../../components/Skeleton.jsx';
import UserAvatar from '../../components/UserAvatar.jsx';
import BookCover from '../../components/BookCover.jsx';
import PublicationCard from '../Map/components/PublicationCard.jsx';
import ReportModal from '../../components/ReportModal.jsx';
import { useToast } from '../../contexts/ToastContext';
import styles from './PublicProfile.module.css';

// MyBooksService.getBooks() returns { ...trackingDoc, bookDetails } — flatten
// to the flat shape hydrateMyBooks/BookRow already expect.
function flattenShelfDoc(doc) {
    const details = doc.bookDetails || {};
    return {
        id: doc.id,
        bookId: doc.bookId || doc.id,
        title: details.title || null,
        authors: details.authors || [],
        coverUrl: details.coverUrl || null,
        status: doc.status || 'reading',
        progress: doc.progressPercentage ?? 0,
        addedAt: doc.addedAt || null,
        rating: doc.rating ?? null,
        notes: doc.notes || null,
    };
}

function BookRow({ book, ownerUid }) {
    return (
        <Link
            to={`${WEB_ROUTES.bookDetail(book.bookId || book.id)}?owner=${ownerUid}`}
            className={styles.bookRow}
        >
            <div className={styles.coverWrap}>
                <BookCover
                    coverUrl={book.coverUrl}
                    imgClassName={styles.cover}
                    placeholderClassName={styles.coverPlaceholder}
                    iconSize={22}
                />
            </div>
            <div className={styles.bookInfo}>
                <span className={styles.bookTitle}>{book.title || 'Untitled'}</span>
                <span className={styles.bookAuthors}>
                    {formatAuthors(book.authors) || 'Unknown author'}
                </span>
            </div>
        </Link>
    );
}

export default function PublicProfile() {
    const { uid } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [shelfBooks, setShelfBooks] = useState([]);
    const [publications, setPublications] = useState([]);
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const [favoriteBusy, setFavoriteBusy] = useState(null);
    const [activeTab, setActiveTab] = useState('myBooks');
    const [reviews, setReviews] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followers, setFollowers] = useState(0);
    const [following, setFollowing] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
    const [followBusy, setFollowBusy] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [, showToast] = useToast(3000);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!uid) return;
        if (currentUser && uid === currentUser.uid) {
            navigate(WEB_ROUTES.PROFILE, { replace: true });
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const u = await UsersService.fetchUserProfile(uid);
                if (cancelled) return;
                if (!u) { setNotFound(true); return; }
                setUser(u);
                setIsFollowing(u.isCurrentUserFollowing);
                setFollowers(u.followers);
                setFollowing(u.following);

                // Load block status and books independently so a permissions error
                // on one does not prevent the other from rendering.
                const blocked = await (currentUser ? doIsBlocked(currentUser.uid, uid).catch(() => false) : false);
                if (cancelled) return;
                setIsBlocked(blocked);

                const rawMyBooks = await MyBooksService.getBooks(uid).catch(() => []);
                if (cancelled) return;

                const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
                const hydrated = await hydrateMyBooks(rawMyBooks.map(flattenShelfDoc), { apiKey });

                if (cancelled) return;
                setShelfBooks(hydrated);

                const pubSummaries = await PublicationService.fetchUserPublications(uid).catch(() => []);
                if (cancelled) return;
                setPublications(pubSummaries.map(s => s.publicationData));

                if (currentUser) {
                    const viewerProfile = await UsersService.fetchUserProfile(currentUser.uid).catch(() => null);
                    if (cancelled) return;
                    setFavoriteIds(new Set(viewerProfile?.favoriteBooks || []));
                }

                const userReviews = await ReviewService.fetchUserReviews(uid).catch(() => []);
                if (!cancelled) setReviews(userReviews);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [uid, currentUser, navigate]);

    async function handleFollowToggle() {
        if (!currentUser || followBusy) return;
        setFollowBusy(true);
        try {
            await UsersService.toggleFollowUser(uid, !isFollowing);
            const newFollowing = !isFollowing;
            setIsFollowing(newFollowing);
            setFollowers(followers + (newFollowing ? 1 : -1));
            showToast(newFollowing ? `Followed @${user.username || 'user'}.` : `Unfollowed @${user.username || 'user'}.`);
        } catch (e) {
            showToast('Action failed. Please try again.');
            console.error(e);
        } finally {
            setFollowBusy(false);
        }
    }

    async function handleToggleFavorite(pubId) {
        if (!currentUser) return;
        setFavoriteBusy(pubId);
        try {
            const isFav = favoriteIds.has(pubId);
            await UsersService.toggleFavoriteStatus(currentUser.uid, pubId, isFav);
            setFavoriteIds(prev => {
                const next = new Set(prev);
                if (isFav) next.delete(pubId);
                else next.add(pubId);
                return next;
            });
        } catch (err) {
            showToast('Action failed. Please try again.');
            console.error(err);
        } finally {
            setFavoriteBusy(null);
        }
    }

    async function handleSubmitReport(reason) {
        if (!currentUser) return;
        try {
            const snapshot = ReportsService.buildAccountSnapshot(user);
            await ReportsService.submitReport(currentUser.uid, REPORT_TARGET_TYPE.ACCOUNT, uid, uid, reason, snapshot);
            showToast('Thanks — our team will review this profile.');
        } catch (e) {
            showToast("We couldn't submit your report. Please try again.");
            console.error(e);
        }
    }

    async function handleBlock() {
        if (!currentUser || blockBusy) return;
        setBlockBusy(true);
        try {
            // If currently following, unfollow first.
            if (isFollowing) {
                await UsersService.toggleFollowUser(uid, false).catch(() => { });
                setIsFollowing(false);
                setFollowers(followers - 1);
            }
            await doBlockUser(currentUser.uid, uid);
            setIsBlocked(true);
            showToast('User blocked.');
        } catch (e) {
            showToast('Block failed. Please try again.');
            console.error(e);
        } finally {
            setBlockBusy(false);
            setShowBlockConfirm(false);
        }
    }

    if (loading) return <div className={styles.page}><SkeletonGrid count={3} /></div>;

    if (notFound) {
        return (
            <div className={styles.page}>
                <div className={styles.header}>
                    <button className={styles.backBtn} onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className={styles.title}>User</h1>
                </div>
                <p className={styles.empty}>User not found.</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <ConfirmDialog
                open={showBlockConfirm}
                onClose={() => setShowBlockConfirm(false)}
                onConfirm={handleBlock}
                title="Block this user?"
                message={`${user.fullName || user.username || 'This user'} won't be able to see your profile or contact you.`}
                confirmLabel="Block"
                danger
                busy={blockBusy}
            />

            <ReportModal
                open={showReportModal}
                onClose={() => setShowReportModal(false)}
                onSubmit={handleSubmitReport}
                title="Report this profile"
            />

            <div className={styles.hero}>
                <UserAvatar user={user} />
                <div className={styles.profileInfo}>
                    <h1 className={styles.name}>{user.fullName || user.username || 'Unknown'}</h1>
                    {user.username && <p className={styles.username}>@{user.username}</p>}
                    {user.bio && <p className={styles.bio}>{user.bio}</p>}
                    <div className={styles.stats}>
                        <span className={styles.stat}>
                            <strong>{publications.length}</strong> book{publications.length === 1 ? '' : 's'}
                        </span>
                        <span className={styles.stat}>
                            <strong>{followers}</strong> follower{followers === 1 ? '' : 's'}
                        </span>
                        <span className={styles.stat}>
                            <strong>{following}</strong> following
                        </span>
                        {user.reviewCount > 0 && (
                            <span className={styles.stat}>
                                ★ <strong>{user.rating?.toFixed(1) || 'N/A'}</strong> ({user.reviewCount} review{user.reviewCount === 1 ? '' : 's'})
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {!isBlocked && (
                <div className={styles.actions}>
                    <button
                        className={`${styles.actionBtn} ${isFollowing ? styles.actionBtnSecondary : styles.actionBtnPrimary}`}
                        onClick={handleFollowToggle}
                        disabled={followBusy}
                    >
                        {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                        {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button
                        className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                        onClick={() => setShowBlockConfirm(true)}
                        disabled={blockBusy}
                    >
                        <Ban size={16} />
                        Block
                    </button>
                    <button
                        className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                        onClick={() => setShowReportModal(true)}
                    >
                        <Flag size={16} />
                        Report
                    </button>
                </div>
            )}

            {isBlocked && (
                <p className={styles.blockedNotice}>You have blocked this user.</p>
            )}

            <div className={styles.dashboard}>
                <div className={styles.booksColumn}>
                    <div className={styles.tabBar}>
                        <button
                            type="button"
                            className={`${styles.tabBtn} ${activeTab === 'myBooks' ? styles.tabBtnActive : ''}`}
                            onClick={() => setActiveTab('myBooks')}
                        >
                            Books
                        </button>
                        <button
                            type="button"
                            className={`${styles.tabBtn} ${activeTab === 'shelf' ? styles.tabBtnActive : ''}`}
                            onClick={() => setActiveTab('shelf')}
                        >
                            Shelf
                        </button>
                    </div>

                    {activeTab === 'myBooks' ? (
                        publications.length === 0 ? (
                            <p className={styles.empty}>This user hasn&rsquo;t listed any books for trade yet.</p>
                        ) : (
                            <div className={styles.bookGrid}>
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
                        )
                    ) : (
                        shelfBooks.length === 0 ? (
                            <p className={styles.empty}>This user hasn&rsquo;t added any books to their shelf yet.</p>
                        ) : (
                            <div className={styles.bookGrid}>
                                {shelfBooks.map(b => <BookRow key={b.id} book={b} ownerUid={uid} />)}
                            </div>
                        )
                    )}
                </div>

                <div className={styles.reviewsColumn}>
                    <h2 className={styles.section}>Reviews</h2>
                    {reviews.length === 0 ? (
                        <p className={styles.empty}>No reviews yet.</p>
                    ) : (
                        <div className={styles.reviewList}>
                            {reviews.map(review => (
                                <div key={review.id} className={styles.reviewItem}>
                                    <div className={styles.reviewHeader}>
                                        <span className={styles.reviewAuthor}>{review.authorName || 'Anonymous'}</span>
                                        <span className={styles.reviewRating}>
                                            {Array(5).fill(0).map((_, i) => (
                                                <span key={i} style={{ color: i < review.rating ? 'var(--primary)' : 'var(--bg-elem)' }}>
                                                    ★
                                                </span>
                                            ))}
                                        </span>
                                    </div>
                                    {review.comment && (
                                        <p className={styles.reviewComment}>{review.comment}</p>
                                    )}
                                    <p className={styles.reviewDate}>
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
