import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, UserCheck, Ban } from 'lucide-react';
import { fetchUserProfile, toggleFollowUser } from '@readme/shared/src/services/users';
import { fetchUserReviews } from '@readme/shared/src/services/reviews';
import { myBooksService } from '@readme/shared/src/services/books';
import { hydrateMyBooks } from '@readme/shared/src/utils/hydrateMyBooks';
import { doBlockUser, doIsBlocked } from '@readme/shared/src/services/blockUser';
import { formatAuthors } from '@readme/shared/src/utils/formatAuthors';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { WEB_ROUTES } from '../../constants/webRoutes';
import Spinner from '../../components/Spinner.jsx';
import UserAvatar from '../../components/UserAvatar.jsx';
import BookCover from '../../components/BookCover.jsx';
import { useToast } from '../../hooks/useToast';
import styles from './PublicProfile.module.css';

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
    const [books, setBooks] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followers, setFollowers] = useState(0);
    const [following, setFollowing] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
    const [followBusy, setFollowBusy] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);
    const [toast, showToast] = useToast(3000);
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
                const u = await fetchUserProfile(uid);
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

                const myBookDocs = await myBooksService.getBooksData(uid).catch(() => []);
                if (cancelled) return;

                const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
                const hydrated = await hydrateMyBooks(myBookDocs, { apiKey });

                if (cancelled) return;
                setBooks(hydrated);

                const userReviews = await fetchUserReviews(uid).catch(() => []);
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
            await toggleFollowUser(uid, !isFollowing);
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

    async function handleBlock() {
        if (!currentUser || blockBusy) return;
        if (!window.confirm(`Block ${user.fullName || user.username || 'this user'}? They won't be able to see your profile or contact you.`)) {
            return;
        }
        setBlockBusy(true);
        try {
            // If currently following, unfollow first.
            if (isFollowing) {
                await toggleFollowUser(uid, false).catch(() => { });
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
        }
    }

    if (loading) return <Spinner center label="Loading profile" />;

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
            {toast && <div className={styles.toast}>{toast}</div>}

            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Back">
                    <ArrowLeft size={20} />
                </button>
            </div>

            <div className={styles.profileCard}>
                <UserAvatar user={user} />
                <div className={styles.profileInfo}>
                    <h1 className={styles.name}>{user.fullName || user.username || 'Unknown'}</h1>
                    {user.username && <p className={styles.username}>@{user.username}</p>}
                    {user.bio && <p className={styles.bio}>{user.bio}</p>}
                    <div className={styles.stats}>
                        <span className={styles.stat}>
                            <strong>{books.length}</strong> book{books.length === 1 ? '' : 's'}
                        </span>
                        <span className={styles.stat}>
                            <strong>{tradeBooks.length}</strong> for trade
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
                        onClick={handleBlock}
                        disabled={blockBusy}
                    >
                        <Ban size={16} />
                        Block
                    </button>
                </div>
            )}

            {isBlocked && (
                <p className={styles.blockedNotice}>You have blocked this user.</p>
            )}

            <h2 className={styles.section}>Books</h2>
            {books.length === 0 ? (
                <p className={styles.empty}>This user hasn&rsquo;t added any books yet.</p>
            ) : (
                <div className={styles.bookList}>
                    {books.map(b => <BookRow key={b.id} book={b} ownerUid={uid} />)}
                </div>
            )}

            {reviews.length > 0 && (
                <>
                    <h2 className={styles.section}>Reviews</h2>
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
                </>
            )}
        </div>
    );
}
