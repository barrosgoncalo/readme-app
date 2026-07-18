import { useEffect, useRef, useState } from 'react';
import { useNavigationType } from 'react-router-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Search, Users, Plus, SlidersHorizontal, X } from 'lucide-react';
import { searchUsers } from '@readme/shared/src/services/searchUser';
import { searchPublicationsByBook } from '@readme/shared/src/services/searchBook';
import { BOOK_CONDITIONS, BOOK_GENRES } from '@readme/shared/src/constants/bookOptions';
import { SORT_OPTIONS } from '@readme/shared/src/services/searchBook';
import { doGetBlockedUsers } from '@readme/shared/src/services/block';
import { UsersService } from '@readme/shared/src/services/users';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { useExploreFeed } from '@readme/shared/src/hooks/use-explore-feed';
import PublicationCard from '../../components/PublicationCard';
import { WEB_ROUTES } from '../../constants/webRoutes';
import UserAvatar from '../../components/UserAvatar';
import Button from '../../components/Button';
import { SkeletonGrid } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import styles from './Explore.module.css';
import {WEB_HITS_PER_PAGE} from "@readme/shared/src/constants/feedConstants.ts";

const SORT_CHOICES = [
    { key: SORT_OPTIONS.DATE_DESC, label: 'Newest first' },
    { key: SORT_OPTIONS.DATE_ASC, label: 'Oldest first' },
    { key: SORT_OPTIONS.TITLE_ASC, label: 'Title A → Z' },
    { key: SORT_OPTIONS.TITLE_DESC, label: 'Title Z → A' },
    { key: SORT_OPTIONS.FAVORITES_DESC, label: 'Most favorited' },
    { key: SORT_OPTIONS.FAVORITES_ASC, label: 'Least favorited' },
];

const EXPLORE_TAB = {
    BOOKS: 'books',
    USERS: 'users',
};

const BOOK_SEARCH_DEBOUNCE_MS = 250;


export default function Explore() {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;
    const [searchParams, setSearchParams] = useSearchParams();
    const navigationType = useNavigationType();

    const [activeTab, setActiveTab] = useState(
        searchParams.get('tab') === EXPLORE_TAB.USERS ? EXPLORE_TAB.USERS : EXPLORE_TAB.BOOKS
    );
    const [search, setSearch] = useState('');

    const [userResults, setUserResults] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [touchedUsers, setTouchedUsers] = useState(false);
    const [searchUserError, setSearchUserError] = useState(false);

    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const [favoriteBusy, setFavoriteBusy] = useState(null);

    const [filtersVisible, setFiltersVisible] = useState(false);

    // 1. Initialize state directly from sessionStorage (with fallbacks)
    const [sortBy, setSortBy] = useState(() =>
        sessionStorage.getItem('exp_sort') || SORT_OPTIONS.DATE_DESC
    );
    const [conditionFilters, setConditionFilters] = useState(() =>
        JSON.parse(sessionStorage.getItem('exp_cond')) || []
    );
    const [genreFilters, setGenreFilters] = useState(() =>
        JSON.parse(sessionStorage.getItem('exp_gen')) || []
    );

    // 2. Save filters to sessionStorage whenever they change
    useEffect(() => {
        sessionStorage.setItem('exp_sort', sortBy);
        sessionStorage.setItem('exp_cond', JSON.stringify(conditionFilters));
        sessionStorage.setItem('exp_gen', JSON.stringify(genreFilters));
    }, [sortBy, conditionFilters, genreFilters]);

    const hasActiveFilters = sortBy !== SORT_OPTIONS.DATE_DESC
        || conditionFilters.length > 0
        || genreFilters.length > 0;

    const {
        items: publications,
        isLoadingInitial: loadingPubs,
        isLoadingMore,
        loadMore,
    } = useExploreFeed({
        excludeUid: uid,
        sortBy,
        conditions: conditionFilters,
        genres: genreFilters,
        includeAllStatuses: false,
        hitsPerPage: WEB_HITS_PER_PAGE,
    });

    useEffect(() => {
        if (!uid) return;
        UsersService.fetchUserProfile(uid)
            .then(profile => setFavoriteIds(new Set(profile?.favoriteBooks || [])))
            .catch(() => {});
    }, [uid]);

    // ==========================================
    // SCROLL RESTORATION LOGIC
    // ==========================================

    // 1. Quietly save the scroll position as the user scrolls (throttled for performance)
    useEffect(() => {
        let throttleTimer;
        const handleScroll = () => {
            if (throttleTimer) return;
            throttleTimer = setTimeout(() => {
                sessionStorage.setItem('exploreScrollPos', window.scrollY);
                throttleTimer = null;
            }, 150); // Write to storage max once every 150ms
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (throttleTimer) clearTimeout(throttleTimer);
        };
    }, []);

    // 2. When the initial books finish loading, jump back to the saved position
    useEffect(() => {
        if (!loadingPubs && publications.length > 0) {
            if (navigationType === 'POP') {
                const savedScroll = sessionStorage.getItem('exploreScrollPos');
                if (savedScroll) {
                    requestAnimationFrame(() => {
                        window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'instant' });
                    });
                }
            } else {
                // Fresh navigation into Explore (nav bar, tab click, etc.) — start clean
                sessionStorage.removeItem('exploreScrollPos');
                window.scrollTo(0, 0);
            }
        }
    }, [loadingPubs, publications.length, navigationType]);
    // ==========================================

    const [bookSearchResults, setBookSearchResults] = useState(null);
    const [searchingBooks, setSearchingBooks] = useState(false);
    const [bookSearchError, setBookSearchError] = useState(null);

    const searchRef = useRef(null);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

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
                    { excludeUid: uid, hitsPerPage: 24 }
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
    }, [search, activeTab, uid]);

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
    const booksToShow = isSearchingBooks
        ? (bookSearchResults || []).map(p => ({ ...p.publicationData, id: p.id }))
        : publications.map(p => ({ ...p.publicationData, id: p.id }));

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
                    {activeTab === EXPLORE_TAB.BOOKS && !isSearchingBooks && (
                        <button
                            type="button"
                            className={`${styles.filterButton} ${hasActiveFilters ? styles.filterButtonActive : ''}`}
                            onClick={() => setFiltersVisible(v => !v)}
                        >
                            <SlidersHorizontal size={18} />
                            {hasActiveFilters && <span className={styles.filterBadgeDot} />}
                        </button>
                    )}
                </div>

                {filtersVisible && activeTab === EXPLORE_TAB.BOOKS && !isSearchingBooks && (
                    <div className={styles.filterPanel}>
                        <div className={styles.filterPanelHeader}>
                            <h3 className={styles.filterPanelTitle}>Filter & Sort</h3>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    className={styles.filterReset}
                                    onClick={() => {
                                        setSortBy(SORT_OPTIONS.DATE_DESC);
                                        setConditionFilters([]);
                                        setGenreFilters([]);
                                    }}
                                >
                                    Reset filters
                                </button>
                            )}
                        </div>

                        <div className={styles.filterGroup}>
                            <span className={styles.filterLabel}>Sort by</span>
                            <select 
                                className={styles.filterSelect} 
                                value={sortBy} 
                                onChange={e => setSortBy(e.target.value)}
                            >
                                {SORT_CHOICES.map((choice) => (
                                    <option key={choice.key} value={choice.key}>
                                        {choice.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.filterGroup}>
                            <span className={styles.filterLabel}>Condition</span>
                            <div className={styles.pillContainer}>
                                {BOOK_CONDITIONS.map(c => {
                                    const isActive = conditionFilters.includes(c);
                                    return (
                                        <label key={c} className={`${styles.filterPill} ${isActive ? styles.filterPillActive : ''}`}>
                                            <input
                                                type="checkbox"
                                                className={styles.hiddenInput}
                                                checked={isActive}
                                                onChange={() => setConditionFilters(prev =>
                                                    prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
                                                )}
                                            />
                                            {c}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {BOOK_GENRES.length > 0 && (
                            <div className={styles.filterGroup}>
                                <span className={styles.filterLabel}>Genre</span>
                                <div className={styles.pillContainer}>
                                    {BOOK_GENRES.map(g => {
                                        const isActive = genreFilters.includes(g);
                                        return (
                                            <label key={g} className={`${styles.filterPill} ${isActive ? styles.filterPillActive : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    className={styles.hiddenInput}
                                                    checked={isActive}
                                                    onChange={() => setGenreFilters(prev =>
                                                        prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
                                                    )}
                                                />
                                                {g}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className={styles.tabs} role="tablist">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === EXPLORE_TAB.BOOKS}
                        className={`${styles.tab} ${activeTab === EXPLORE_TAB.BOOKS ? styles.tabActive : ''}`}
                        onClick={() => handleTabChange(EXPLORE_TAB.BOOKS)}
                    >
                        <BookOpen size={16} /> Books
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === EXPLORE_TAB.USERS}
                        className={`${styles.tab} ${activeTab === EXPLORE_TAB.USERS ? styles.tabActive : ''}`}
                        onClick={() => handleTabChange(EXPLORE_TAB.USERS)}
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
                    ) : booksToShow.length === 0 ? (
                        <EmptyState
                            title={search.trim() || hasActiveFilters ? 'No matches' : 'No publications yet'}
                            message={search.trim() ? 'No publications match your search.' : 'No publications match these filters.'}
                        />
                    ) : (
                        <>
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
                            {!isSearchingBooks && (
                                <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
                                    <Button variant="ghost" onClick={loadMore} disabled={isLoadingMore}>
                                        {isLoadingMore ? 'Loading…' : 'Load more'}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
