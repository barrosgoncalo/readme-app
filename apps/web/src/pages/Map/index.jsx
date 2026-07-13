import {useCallback, useEffect, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {BookOpen, Search, Users, Plus} from 'lucide-react';
import {searchUsers} from '@readme/shared/src/services/search';
import {doGetBlockedUids, doGetBlockedUsers} from '@readme/shared/src/services/blockUser';
import {fetchAllPublications} from '@readme/shared/src/services/publications';
import {fetchUserProfile, toggleFavoriteStatus} from '@readme/shared/src/services/users';
import {useAuth} from '@readme/shared/src/contexts/AuthContext/web';
import PublicationCard from './components/PublicationCard.jsx';
import {WEB_ROUTES} from '../../constants/webRoutes';
import {PUBLICATION_STATUS} from '@readme/shared/src/constants/status';
import UserAvatar from '../../components/UserAvatar.jsx';
import Spinner from '../../components/Spinner.jsx';
import Button from '../../components/Button.jsx';
import styles from './Map.module.css';

const EXPLORE_TAB = {
    BOOKS: 'books',
    USERS: 'users',
};

export default function Explore() {
    const {currentUser} = useAuth();
    const uid = currentUser?.uid;
    const [searchParams] = useSearchParams();

    const [activeTab, setActiveTab] = useState(
        searchParams.get('tab') === EXPLORE_TAB.USERS ? EXPLORE_TAB.USERS : EXPLORE_TAB.BOOKS
    );
    const [search, setSearch] = useState('');

    const [userResults, setUserResults] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [touchedUsers, setTouchedUsers] = useState(false);
    const [searchUserError, setSearchUserError] = useState(false);

    const [publications, setPublications] = useState([]);
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const [loadingPubs, setLoadingPubs] = useState(true);
    const [pubsError, setPubsError] = useState(null);
    const [favoriteBusy, setFavoriteBusy] = useState(null);

    const loadPublications = useCallback(async () => {
        if (!uid) return;

        setLoadingPubs(true);
        setPubsError(null);

        try {
            const [allPubs, blockedUids, profile] = await Promise.all([
                fetchAllPublications(),
                doGetBlockedUids(uid).catch(() => new Set()),
                fetchUserProfile(uid).catch(() => null)
            ]);

            // Filter: exclude blocked users, user's own pubs, non-available
            const filtered = allPubs.filter(pub =>
                pub.uid !== uid &&
                !blockedUids.has(pub.uid) &&
                pub.status === PUBLICATION_STATUS.AVAILABLE
            );

            setPublications(filtered);
            setFavoriteIds(new Set(profile?.favoriteBooks || []));
        } catch (err) {
            setPubsError(err.message || 'Could not load publications.');
        } finally {
            setLoadingPubs(false);
        }
    }, [uid]);

    useEffect(() => {
        loadPublications();
    }, [loadPublications]);

    async function handleToggleFavorite(pubId) {
        if (!uid) return;
        setFavoriteBusy(pubId);
        try {
            const isFav = favoriteIds.has(pubId);
            await toggleFavoriteStatus(uid, pubId, isFav);
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

    useEffect(() => {
        if (activeTab !== EXPLORE_TAB.USERS) return;

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

    const filteredPubs = publications.filter((pub) => {
        const title = (pub.book?.title || '').toLowerCase();
        const author = (pub.book?.author || '').toLowerCase();
        const q = search.toLowerCase();

        return title.includes(q) || author.includes(q);
    });

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Explore, Swap & Discover</h1>
            <p className={styles.subtitle}>Find other readers or discover books available for trade.</p>

            <div className={styles.searchRow}>
                <Search size={16} className={styles.searchIcon}/>
                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder={activeTab === EXPLORE_TAB.BOOKS ? "Search books or authors..." : "Search users by name or username..."}
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
                    aria-selected={activeTab === EXPLORE_TAB.BOOKS}
                    className={`${styles.tab} ${activeTab === EXPLORE_TAB.BOOKS ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab(EXPLORE_TAB.BOOKS)}
                >
                    <BookOpen size={16}/> Books
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === EXPLORE_TAB.USERS}
                    className={`${styles.tab} ${activeTab === EXPLORE_TAB.USERS ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab(EXPLORE_TAB.USERS)}
                >
                    <Users size={16}/> Users
                </button>
            </div>

            {/* TAB: USERS */}
            {activeTab === EXPLORE_TAB.USERS && (
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
            {activeTab === EXPLORE_TAB.BOOKS && (
                <div className={styles.section}>
                    <Link
                        to={WEB_ROUTES.PUBLICATION_NEW}
                        style={{display: 'block', marginBottom: 'var(--space-3)'}}
                    >
                        <Button>
                            <Plus size={16}/> New Publication
                        </Button>
                    </Link>

                    {loadingPubs ? (
                        <Spinner center label="Loading publications..."/>
                    ) : pubsError ? (
                        <p className={styles.status}>{pubsError}</p>
                    ) : filteredPubs.length === 0 ? (
                        <p className={styles.status}>
                            {search.trim() ? "No publications match your search." : "No publications available right now."}
                        </p>
                    ) : (
                        <div className={styles.pubGrid}>
                            {filteredPubs.map((pub) => (
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
            )}
        </div>
    );
}
