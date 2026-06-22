import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { WEB_ROUTES } from '../constants/webRoutes';
import Spinner from './Spinner.jsx';
import UserAvatar from './UserAvatar.jsx';
import { useToast } from '../hooks/useToast';
import styles from './UserListPage.module.css';

export default function UserListPage({
    title,
    singularCount,
    pluralCount,
    emptyText,
    metaDescription,
    loadUsers,
    actionLabel,
    onAction,
    actionToast,
    rowClickable = false,
}) {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [toast, showToast] = useToast();

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [busy, setBusy] = useState(null);

    useEffect(() => {
        if (!currentUser) return;
        let cancelled = false;
        (async () => {
            try {
                const profiles = await loadUsers(currentUser.uid);
                if (cancelled) return;
                profiles.sort((a, b) =>
                    (a.fullName || a.username || '').localeCompare(b.fullName || b.username || '')
                );
                setUsers(profiles);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [currentUser, loadUsers]);

    async function handleAction(uid) {
        setBusy(uid);
        try {
            const user = users.find(u => u.id === uid);
            await onAction(currentUser.uid, uid);
            setUsers(prev => prev.filter(u => u.id !== uid));
            showToast(actionToast(user?.fullName || user?.username || 'User'));
        } finally {
            setBusy(null);
        }
    }

    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        return !q
            || (u.fullName || '').toLowerCase().includes(q)
            || (u.username || '').toLowerCase().includes(q);
    });

    if (loading) return <Spinner center label={`Loading ${title.toLowerCase()}`} />;

    return (
        <div className={styles.page}>
            {toast && <div className={styles.toast}>{toast}</div>}

            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate(WEB_ROUTES.PROFILE)}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className={styles.title}>{title}</h1>
            </div>

            <div className={styles.searchRow}>
                <Search size={16} className={styles.searchIcon} />
                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className={styles.meta}>
                <span className={styles.count}>
                    {filtered.length} {filtered.length === 1 ? singularCount : pluralCount}
                </span>
                {metaDescription && users.length > 0 && (
                    <p className={styles.description}>{metaDescription}</p>
                )}
            </div>

            {users.length === 0 ? (
                <div className={styles.empty}>{emptyText}</div>
            ) : (
                <div className={styles.list}>
                    {filtered.map((user, i) => (
                        <div key={user.id}>
                            {i > 0 && <div className={styles.divider} />}
                            <div
                                className={styles.row}
                                style={rowClickable ? { cursor: 'pointer' } : undefined}
                                onClick={rowClickable ? () => navigate(WEB_ROUTES.userProfile(user.id)) : undefined}
                            >
                                <UserAvatar user={user} />
                                <div className={styles.info}>
                                    <span className={styles.name}>{user.fullName || user.username || 'Unknown'}</span>
                                    {user.username && <span className={styles.username}>@{user.username}</span>}
                                </div>
                                <button
                                    className={styles.actionBtn}
                                    onClick={e => { e.stopPropagation(); handleAction(user.id); }}
                                    disabled={busy === user.id}
                                >
                                    {busy === user.id ? '…' : actionLabel}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
