import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Search, Users, Plus } from 'lucide-react';
import { searchUsers } from '@readme/shared/src/services/searchUser';
import { searchPublicationsByBook } from '@readme/shared/src/services/searchBook'; // adjust path
import { doGetBlockedUids, doGetBlockedUsers } from '@readme/shared/src/services/block';
import { PublicationService } from '@readme/shared/src/services/publications';
import { UsersService } from '@readme/shared/src/services/users';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import PublicationCard from './components/PublicationCard.jsx';
import { WEB_ROUTES } from '../../constants/webRoutes';
import UserAvatar from '../../components/UserAvatar.jsx';
import Spinner from '../../components/Spinner.jsx';
import Button from '../../components/Button.jsx';
import { SkeletonGrid } from '../../components/Skeleton.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import styles from './Map.module.css';

const EXPLORE_TAB = {
    BOOKS: 'books',
    USERS: 'users',
};

const BOOK_SEARCH_DEBOUNCE_MS = 250;

export default function Explore() {
    const { currentUser } = useAuth();
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

    // Default "browse everything" state (shown when the search box is empty)
    const [publications, setPublications] = useState([]);
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const [loadingPubs, setLoadingPubs] = useState(true);
    const [pubsError, setPubsError] = useState(null);
    const [favoriteBusy, setFavoriteBusy] = useState(null);
    const [blockedUids, setBlockedUids] = useState([]);

    // Algolia-backed search state (shown once the user types a query)
    const [bookSearchResults, setBookSearchResults] = useState(null); // null = no active search
    const [searchingBooks, setSearchingBooks] = useState(false);
    const [bookSearchError, setBookSearchError] = useState(null);

    const searchRef = useRef(null);

    const loadPublications = useCallback(async () => {
        if (!uid) return;

        setLoadingPubs(true);
        setPubsError(null);

        try {
            const [blocked, profile] = await Promise.all([
                doGetBlockedUids(uid).catch(() => []),
                UsersService.fetchUserProfile(uid).catch(() => null)
            ]);

            setBlockedUids(blocked);

            const summaries = await PublicationService.fetchExplorePublications(uid, blocked);

            setPublications(summaries.map(s => s.publicationData));
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

    // Users tab search (unchanged)
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
                const blockedProfiles = currentUser
                    ? await doGetBlockedUsers(currentUser.uid).catch(() => [])
                    : [];
                const blockedUidsForUsers = blockedProfiles.map(p => p.id);

                const { users } = await searchUsers(q, {
                    excludeUid: currentUser?.uid,
                    blockedUids: blockedUidsForUsers,
                });

                if (!cancelled) setUserResults(users);
            } catch {
                if (!cancelled) setSearchUserError(true);
            } finally {
                if (!cancelled) setLoadingUsers(false);
            }
        }, BOOK_SEARCH_DEBOUNCE_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [search, currentUser?.uid, activeTab]);

    // Books tab search — now backed by Algolia instead of client-side filtering
    useEffect(() => {
        if (activeTab !== EXPLORE_TAB.BOOKS) return;

        const q = search.trim();
        if (!q) {
            setBookSearchResults(null);
            setSearchingBooks(false);
            setBookSearchError(null);
            return;
        }

        setSearchingBooks(true);
        setBookSearchError(null);

        let cancelled = false;

        const timer = setTimeout(async () => {
            try {
                const { publications: pubs } = await searchPublicationsByBook(
                    { title: q },
                    { excludeUid: uid, blockedUids, hitsPerPage: 24 }
                );
                if (!cancelled) setBookSearchResults(pubs.map(p => p.publicationData));
            } catch (err) {
                console.error('Book search failed:', err);
                if (!cancelled) setBookSearchError('Search failed. Please try again.');
            } finally {
                if (!cancelled) setSearchingBooks(false);
            }
        }, BOOK_SEARCH_DEBOUNCE_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [search, activeTab, uid, blockedUids]);

    useEffect(() => {
        function onKeyDown(e) {
            if (e.key === '/' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                searchRef.current?.focus();
            }
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    const isSearchingBooks = search.trim().length > 0;
    const booksToShow = isSearchingBooks ? (bookSearchResults || []) : publications;

    return (
        <div className={styles.page}>
            <div className={styles.stickyHeader}>
                <h1 className={styles.title}>Explore, Swap & Discover</h1>
                <p className={styles.subtitle}>Find other readers or discover books available for trade.</p>

                <div className={styles.searchRow}>
                    <Search size={16} className={styles.searchIcon} />
                    <input
                        ref={searchRef}
                        className={styles.searchInput}
                        type="text"
                        placeholder={activeTab === EXPLORE_TAB.BOOKS ? "Search books or authors..." : "Search users by name or username..."}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className={styles.tabs} role="tablist">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === EXPLORE_TAB.BOOKS}
                        className={`${styles.tab} ${activeTab === EXPLORE_TAB.BOOKS ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab(EXPLORE_TAB.BOOKS)}
                    >
                        <BookOpen size={16} /> Books
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === EXPLORE_TAB.USERS}
                        className={`${styles.tab} ${activeTab === EXPLORE_TAB.USERS ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab(EXPLORE_TAB.USERS)}
                    >
                        <Users size={16} /> Users
                    </button>
                </div>
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
                        <div className={styles.userGrid}>
                            {userResults.map((u) => (
                                <Link key={u.uid} to={WEB_ROUTES.userProfile(u.uid)} className={styles.userCard}>
                                    <UserAvatar user={u} />
                                    <div className={styles.info}>
                                        <span className={styles.name}>{u.fullName || u.username || 'Unknown'}</span>
                                        {u.username && <span className={styles.username}>@{u.username}</span>}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: BOOKS */}
            {activeTab === EXPLORE_TAB.BOOKS && (
                <div className={styles.section}>
                    <Link to={WEB_ROUTES.PUBLICATION_NEW}>
                        <Button style={{ marginBottom: 'var(--space-3)' }}>
                            <Plus size={16} /> New Publication
                        </Button>
                    </Link>

                    {(isSearchingBooks ? searchingBooks : loadingPubs) ? (
                        <SkeletonGrid count={6} />
                    ) : isSearchingBooks && bookSearchError ? (
                        <p className={styles.status}>{bookSearchError}</p>
                    ) : !isSearchingBooks && pubsError ? (
                        <p className={styles.status}>{pubsError}</p>
                    ) : booksToShow.length === 0 ? (
                        <EmptyState
                            title={search.trim() ? 'No matches' : 'No publications yet'}
                            message={search.trim() ? 'No publications match your search.' : 'No publications available right now.'}
                        />
                    ) : (
                        <div className={styles.pubGrid}>
                            {booksToShow.map((pub) => (
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