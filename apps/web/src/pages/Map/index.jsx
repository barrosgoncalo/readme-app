import {useCallback, useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {BookOpen, Search, Users} from 'lucide-react';
import {searchUsers} from '@readme/shared/src/services/search.web';
import {doGetBlockedUsers} from '@readme/shared/src/services/blockUser.web';
import {getAvailableTradeBooks} from '@readme/shared/src/services/trades.web';
import {getBooksByIds} from '@readme/shared/src/services/booksCatalog.web';
import {getUsersByIds} from '@readme/shared/src/services/users.web';
import {useAuth} from '@readme/shared/src/contexts/AuthContext/web';
import TradeCard from './components/TradeCard.jsx';
import {WEB_ROUTES} from '../../constants/webRoutes';
import UserAvatar from '../../components/UserAvatar.jsx';
import Spinner from '../../components/Spinner.jsx';
import styles from './Map.module.css';

export default function Explore() {
    const {currentUser} = useAuth();
    const uid = currentUser?.uid;

    const [activeTab, setActiveTab] = useState('books');
    const [search, setSearch] = useState('');

    const [userResults, setUserResults] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [touchedUsers, setTouchedUsers] = useState(false);
    const [searchUserError, setSearchUserError] = useState(false);

    const [userDetails, setUserDetails] = useState({});
    const [availableBooks, setAvailableBooks] = useState([]);
    const [bookDetails, setBookDetails] = useState({});
    const [loadingTrades, setLoadingTrades] = useState(true);
    const [tradesError, setTradesError] = useState(null);

    const loadTrades = useCallback(async () => {
        if (!uid) return;

        setLoadingTrades(true);
        setTradesError(null);

        try {
            const available = await getAvailableTradeBooks(uid);
            setAvailableBooks(available);

            const bookIds = new Set();
            const ownerIds = new Set();

            available.forEach((item) => {
                bookIds.add(item.bookId);
                ownerIds.add(item.ownerId);
            });

            const [books, users] = await Promise.all([
                bookIds.size > 0 ? getBooksByIds(Array.from(bookIds)) : Promise.resolve([]),
                ownerIds.size > 0 ? getUsersByIds(Array.from(ownerIds)) : Promise.resolve({})
            ]);

            const booksMap = {};
            books.forEach((b) => booksMap[b.id] = b);

            setBookDetails(booksMap);
            setUserDetails(users);

        } catch (err) {
            setTradesError(err.message || 'Could not load available trades.');
        } finally {
            setLoadingTrades(false);
        }
    }, [uid]);

    useEffect(() => {
        loadTrades();
    }, [loadTrades]);

    useEffect(() => {
        if (activeTab !== 'users') return;

        const q = search.trim();
        if (!q) {
            setUserResults([]);
            setTouchedUsers(false);
            setSearchUserError(false);
            return;
        }

        setTouchedUsers(true);
        setLoadingUsers(true);
        setSearchUserError(false);

        let cancelled = false;

        const timer = setTimeout(async () => {
            try {
                const [found, blockedProfiles] = await Promise.all([
                    searchUsers(q, currentUser?.uid),
                    currentUser ? doGetBlockedUsers(currentUser.uid).catch(() => []) : Promise.resolve([]),
                ]);

                const blockedUids = new Set(blockedProfiles.map(p => p.id));

                if (!cancelled) setUserResults(found.filter(u => !blockedUids.has(u.uid)));
            } catch {
                if (!cancelled) setSearchUserError(true);
            } finally {
                if (!cancelled) setLoadingUsers(false);
            }
        }, 250);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [search, currentUser?.uid, activeTab]);

    const filteredTrades = availableBooks.filter((item) => {
        const book = bookDetails[item.bookId] || {};
        const title = (book.title || '').toLowerCase();
        const author = (Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || '')).toLowerCase();
        const q = search.toLowerCase();

        return title.includes(q) || author.includes(q);
    });

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Explore, Swap & Discover</h1>
            <p className={styles.subtitle}>Find other readers or discover books available for trade.</p>

            {/* Barra de Pesquisa */}
            <div className={styles.searchRow}>
                <Search size={16} className={styles.searchIcon}/>
                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder={activeTab === 'books' ? "Search books or authors..." : "Search users by name or username..."}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    autoFocus
                />
            </div>

            {/* Filtros (Tabs) */}
            <div className={styles.tabs} role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'books'}
                    className={`${styles.tab} ${activeTab === 'books' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('books')}
                >
                    <BookOpen size={16}/> Books
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'users'}
                    className={`${styles.tab} ${activeTab === 'users' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <Users size={16}/> Users
                </button>
            </div>

            {/* TAB: USERS */}
            {activeTab === 'users' && (
                <div className={styles.section}>
                    {loadingUsers && <p className={styles.status}>Searching users...</p>}
                    {!loadingUsers && searchUserError && (
                        <p className={styles.status}>Search failed. Please try again.</p>
                    )}
                    {!loadingUsers && !searchUserError && touchedUsers && userResults.length === 0 && (
                        <p className={styles.status}>No users found for &ldquo;{search.trim()}&rdquo;.</p>
                    )}
                    {!search.trim() && !touchedUsers && (
                        <p className={styles.status}>Type a username or name to find someone.</p>
                    )}

                    {userResults.length > 0 && (
                        <div className={styles.list}>
                            {userResults.map((u, i) => (
                                <div key={u.uid}>
                                    {i > 0 && <div className={styles.divider}/>}
                                    <Link to={WEB_ROUTES.userProfile(u.uid)} className={styles.row}>
                                        <UserAvatar user={u}/>
                                        <div className={styles.info}>
                                            <span className={styles.name}>{u.fullName || u.username || 'Unknown'}</span>
                                            {u.username && <span className={styles.username}>@{u.username}</span>}
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: BOOKS */}
            {activeTab === 'books' && (
                <div className={styles.section}>
                    {loadingTrades ? (
                        <Spinner center label="Loading books..."/>
                    ) : tradesError ? (
                        <p className={styles.status}>{tradesError}</p>
                    ) : filteredTrades.length === 0 ? (
                        <p className={styles.status}>
                            {search.trim() ? "No books match your search." : "No books available for trade right now."}
                        </p>
                    ) : (
                        <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap'}}>
                            {filteredTrades.map((item, index) => {
                                const book = bookDetails[item.bookId] || {
                                    id: item.bookId,
                                    title: 'Untitled',
                                    authors: []
                                };

                                const owner = userDetails[item.ownerId] || {};
                                
                                const tradeData = {
                                    bookId: item.bookId,
                                    coverUrl: book.coverUrl,
                                    ownerUid: item.ownerId,
                                    ownerUsername: owner.username || 'user',
                                    ownerAvatar: owner.photoURL || null
                                };

                                return (
                                    <TradeCard
                                        key={`${item.bookId}-${item.ownerId}-${index}`}
                                        trade={tradeData}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}