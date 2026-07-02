import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { searchUsers } from '@readme/shared/src/services/users';
import { doGetBlockedUids } from '@readme/shared/src/services/blockUser';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { WEB_ROUTES } from '../../constants/webRoutes';
import UserAvatar from '../../components/UserAvatar.jsx';
import styles from './Map.module.css';

export default function Explore() {
    const { currentUser } = useAuth();
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState(false);
    const [searchError, setSearchError] = useState(false);

    useEffect(() => {
        const q = search.trim();
        if (!q) {
            setResults([]);
            setTouched(false);
            setSearchError(false);
            return;
        }
        setTouched(true);
        setLoading(true);
        setSearchError(false);
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const [found, blockedUids] = await Promise.all([
                    searchUsers(q, { excludeUid: currentUser?.uid }),
                    currentUser ? doGetBlockedUids(currentUser.uid).catch(() => new Set()) : Promise.resolve(new Set()),
                ]);
                if (!cancelled) setResults(found.filter(u => !blockedUids.has(u.id)));
            } catch {
                if (!cancelled) setSearchError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 250);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [search, currentUser?.uid]);

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Explore</h1>
            <p className={styles.subtitle}>Find other readers by username or name.</p>

            <div className={styles.searchRow}>
                <Search size={16} className={styles.searchIcon} />
                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Search users"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    autoFocus
                />
            </div>

            {loading && <p className={styles.status}>Searching…</p>}

            {!loading && searchError && (
                <p className={styles.status}>Search failed. Please try again.</p>
            )}

            {!loading && !searchError && touched && results.length === 0 && (
                <p className={styles.status}>No users found for &ldquo;{search.trim()}&rdquo;.</p>
            )}

            {results.length > 0 && (
                <div className={styles.list}>
                    {results.map((u, i) => (
                        <div key={u.id}>
                            {i > 0 && <div className={styles.divider} />}
                            <Link to={WEB_ROUTES.userProfile(u.id)} className={styles.row}>
                                <UserAvatar user={u} />
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
    );
}
