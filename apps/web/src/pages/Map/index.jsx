import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { searchUsers } from '@readme/shared/src/services/users.web';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { WEB_ROUTES } from '../../constants/webRoutes';
import styles from './Map.module.css';

function initialsFor(user) {
    const name = user?.fullName || user?.username || '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

export default function Explore() {
    const { currentUser } = useAuth();
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState(false);

    useEffect(() => {
        const q = search.trim();
        if (!q) {
            setResults([]);
            setTouched(false);
            return;
        }
        setTouched(true);
        setLoading(true);
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const found = await searchUsers(q, { excludeUid: currentUser?.uid });
                if (!cancelled) setResults(found);
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

            {!loading && touched && results.length === 0 && (
                <p className={styles.status}>No users found for &ldquo;{search.trim()}&rdquo;.</p>
            )}

            {results.length > 0 && (
                <div className={styles.list}>
                    {results.map((u, i) => (
                        <div key={u.id}>
                            {i > 0 && <div className={styles.divider} />}
                            <Link to={WEB_ROUTES.userProfile(u.id)} className={styles.row}>
                                <div className={styles.avatar}>
                                    {u.photoURL
                                        ? <img src={u.photoURL} alt="" className={styles.avatarImg} />
                                        : <span className={styles.avatarInitials}>{initialsFor(u)}</span>}
                                </div>
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
