import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, UserPlus, UserCheck, Ban, Repeat } from 'lucide-react';
import { getUserById } from '@readme/shared/src/services/users.web';
import { myBooksService } from '@readme/shared/src/services/books.web';
import { getBook, getBookByIsbn, getBooksByIds } from '@readme/shared/src/services/booksCatalog.web';
import { mapGoogleBook } from '@readme/shared/src/models/book';
import { doAddFriend, doRemoveFriend, doIsFriend } from '@readme/shared/src/services/friendUser.web';
import { doBlockUser, doIsBlocked } from '@readme/shared/src/services/blockUser.web';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { WEB_ROUTES } from '../../constants/webRoutes';
import Spinner from '../../components/Spinner.jsx';
import styles from './PublicProfile.module.css';

function initialsFor(user) {
    const name = user?.fullName || user?.username || '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function BookRow({ book, ownerUid }) {
    return (
        <Link
            to={`${WEB_ROUTES.bookDetail(book.bookId || book.id)}?owner=${ownerUid}`}
            className={styles.bookRow}
        >
            <div className={styles.coverWrap}>
                {book.coverUrl
                    ? <img src={book.coverUrl} alt="" className={styles.cover} />
                    : <div className={styles.coverPlaceholder}><BookOpen size={22} /></div>}
            </div>
            <div className={styles.bookInfo}>
                <span className={styles.bookTitle}>{book.title || 'Untitled'}</span>
                <span className={styles.bookAuthors}>
                    {Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || 'Unknown author')}
                </span>
            </div>
            {book.availableForTrade && (
                <span className={styles.tradeBadge} title="Available for trade">
                    <Repeat size={14} />
                </span>
            )}
        </Link>
    );
}

export default function PublicProfile() {
    const { uid } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [books, setBooks] = useState([]);
    const [isFriend, setIsFriend] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [friendBusy, setFriendBusy] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);
    const [toast, setToast] = useState('');
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
                const u = await getUserById(uid);
                if (cancelled) return;
                if (!u) { setNotFound(true); return; }
                setUser(u);

                // Load social status and books independently so a permissions error
                // on one does not prevent the other from rendering.
                const [friend, blocked] = await Promise.all([
                    currentUser ? doIsFriend(currentUser.uid, uid).catch(() => false) : false,
                    currentUser ? doIsBlocked(currentUser.uid, uid).catch(() => false) : false,
                ]);
                if (cancelled) return;
                setIsFriend(friend);
                setIsBlocked(blocked);

                const myBookDocs = await myBooksService.getBooksData(uid).catch(() => []);
                if (cancelled) return;

                const myIds = myBookDocs.map(d => d.id);
                const myBooksMap = Object.fromEntries(myBookDocs.map(m => [m.id, m]));

                const catalogMap = {};
                try {
                    const catalogDocs = await getBooksByIds(myIds);
                    catalogDocs.forEach(c => { catalogMap[c.id] = c; });
                } catch { /* batch may fail; fall through to individual gets */ }

                const missingIds = myIds.filter(id => !catalogMap[id]);
                if (missingIds.length > 0) {
                    const settled = await Promise.allSettled(missingIds.map(id => getBook(id)));
                    settled.forEach((res, i) => {
                        if (res.status === 'fulfilled' && res.value) {
                            catalogMap[missingIds[i]] = res.value;
                        }
                    });
                }

                const hydrated = myIds.map(id => {
                    const my = myBooksMap[id];
                    const cat = catalogMap[id];
                    return {
                        id,
                        bookId: id,
                        title: cat?.title || my?.title || null,
                        authors: cat?.authors || my?.authors || [],
                        coverUrl: cat?.coverUrl || my?.coverUrl || null,
                        description: cat?.description || null,
                        status: my?.status || 'reading',
                        addedAt: my?.addedAt || null,
                        rating: my?.rating ?? null,
                        availableForTrade: my?.availableForTrade ?? false,
                    };
                });

                // Legacy ISBN-based repair: for old books with no title and an ISBN-shaped
                // ID, try the global cache by ISBN, then Google Books. Read-only — we
                // can't write to another user's myBooks subcollection.
                const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
                const needsRepair = hydrated.filter(b => !b.title && /^\d{10,13}$/.test(b.id));
                if (needsRepair.length > 0) {
                    await Promise.allSettled(needsRepair.map(async b => {
                        try {
                            let title, authors, coverUrl;
                            const cached = await getBookByIsbn(b.id);
                            if (cached?.title) {
                                title = cached.title;
                                authors = cached.authors || [];
                                coverUrl = cached.coverUrl || null;
                            } else if (apiKey) {
                                const res = await fetch(
                                    `https://www.googleapis.com/books/v1/volumes?q=isbn:${b.id}&maxResults=1&key=${apiKey}`
                                );
                                const json = await res.json();
                                const item = json.items?.[0];
                                if (!item) return;
                                const mapped = mapGoogleBook(item);
                                if (!mapped.title || mapped.title === 'Unknown Title') return;
                                title = mapped.title;
                                authors = mapped.authors;
                                coverUrl = mapped.coverUrl;
                            } else {
                                return;
                            }
                            const idx = hydrated.findIndex(h => h.id === b.id);
                            if (idx !== -1) {
                                hydrated[idx] = { ...hydrated[idx], title, authors, coverUrl };
                            }
                        } catch { /* keep placeholder on error */ }
                    }));
                }

                if (!cancelled) setBooks(hydrated);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [uid, currentUser, navigate]);

    function showToast(message) {
        setToast(message);
        setTimeout(() => setToast(''), 3000);
    }

    async function handleFriendToggle() {
        if (!currentUser || friendBusy) return;
        setFriendBusy(true);
        try {
            if (isFriend) {
                await doRemoveFriend(currentUser.uid, uid);
                setIsFriend(false);
                showToast(`Removed ${user.username ? '@' + user.username : 'user'} from friends.`);
            } else {
                await doAddFriend(currentUser.uid, uid);
                setIsFriend(true);
                showToast(`Added ${user.username ? '@' + user.username : 'user'} to friends.`);
            }
        } catch (e) {
            showToast('Action failed. Please try again.');
            console.error(e);
        } finally {
            setFriendBusy(false);
        }
    }

    async function handleBlock() {
        if (!currentUser || blockBusy) return;
        if (!window.confirm(`Block ${user.fullName || user.username || 'this user'}? They won't be able to see your profile or contact you.`)) {
            return;
        }
        setBlockBusy(true);
        try {
            // If they were on your friends list, drop them first.
            if (isFriend) {
                await doRemoveFriend(currentUser.uid, uid).catch(() => { });
                setIsFriend(false);
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

    const tradeBooks = books.filter(b => b.availableForTrade);

    return (
        <div className={styles.page}>
            {toast && <div className={styles.toast}>{toast}</div>}

            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Back">
                    <ArrowLeft size={20} />
                </button>
            </div>

            <div className={styles.profileCard}>
                <div className={styles.avatar}>
                    {user.photoURL
                        ? <img src={user.photoURL} alt="" className={styles.avatarImg} />
                        : <span className={styles.avatarInitials}>{initialsFor(user)}</span>}
                </div>
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
                    </div>
                </div>
            </div>

            {!isBlocked && (
                <div className={styles.actions}>
                    <button
                        className={`${styles.actionBtn} ${isFriend ? styles.actionBtnSecondary : styles.actionBtnPrimary}`}
                        onClick={handleFriendToggle}
                        disabled={friendBusy}
                    >
                        {isFriend ? <UserCheck size={16} /> : <UserPlus size={16} />}
                        {isFriend ? 'Friends' : 'Add friend'}
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

            <h2 className={styles.section}>Available for trade</h2>
            {tradeBooks.length === 0 ? (
                <p className={styles.empty}>No books available for trade.</p>
            ) : (
                <div className={styles.bookList}>
                    {tradeBooks.map(b => <BookRow key={b.id} book={b} ownerUid={uid} />)}
                </div>
            )}

            <h2 className={styles.section}>All books</h2>
            {books.length === 0 ? (
                <p className={styles.empty}>This user hasn&rsquo;t added any books yet.</p>
            ) : (
                <div className={styles.bookList}>
                    {books.map(b => <BookRow key={b.id} book={b} ownerUid={uid} />)}
                </div>
            )}
        </div>
    );
}
