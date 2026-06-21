import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { doGetFriends, doRemoveFriend } from '@readme/shared/src/services/friendUser.web';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { WEB_ROUTES } from '../../constants/webRoutes';
import Spinner from '../../components/Spinner.jsx';
import styles from './BlockedUsers.module.css';

function initials(user) {
    const name = user?.fullName || user?.username || '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

export default function Friends() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [friends, setFriends] = useState([]);
    const [search, setSearch] = useState('');
    const [removing, setRemoving] = useState(null);
    const [toast, setToast] = useState('');

    useEffect(() => {
        if (!currentUser) return;
        let cancelled = false;
        (async () => {
            try {
                const profiles = await doGetFriends(currentUser.uid);
                if (cancelled) return;
                profiles.sort((a, b) => (a.fullName || a.username || '').localeCompare(b.fullName || b.username || ''));
                setFriends(profiles);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [currentUser]);

    async function handleRemove(uid) {
        setRemoving(uid);
        try {
            const user = friends.find(u => u.id === uid);
            await doRemoveFriend(currentUser.uid, uid);
            setFriends(prev => prev.filter(u => u.id !== uid));
            const name = user?.fullName || user?.username || 'User';
            setToast(`Removed ${name} from friends.`);
            setTimeout(() => setToast(''), 3500);
        } finally {
            setRemoving(null);
        }
    }

    function handleRowClick(uid) {
        navigate(WEB_ROUTES.userProfile(uid));
    }

    const filtered = friends.filter(u => {
        const q = search.toLowerCase();
        return !q
            || (u.fullName || '').toLowerCase().includes(q)
            || (u.username || '').toLowerCase().includes(q);
    });

    if (loading) return <Spinner center label="Loading friends" />;

    return (
        <div className={styles.page}>
            {toast && <div className={styles.toast}>{toast}</div>}

            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate(WEB_ROUTES.PROFILE)}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className={styles.title}>Friends</h1>
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
                <span className={styles.count}>{filtered.length} {filtered.length === 1 ? 'FRIEND' : 'FRIENDS'}</span>
            </div>

            {friends.length === 0 ? (
                <div className={styles.empty}>You haven't added any friends yet.</div>
            ) : (
                <div className={styles.list}>
                    {filtered.map((user, i) => (
                        <div key={user.id}>
                            {i > 0 && <div className={styles.divider} />}
                            <div className={styles.row} style={{ cursor: 'pointer' }} onClick={() => handleRowClick(user.id)}>
                                <div className={styles.avatar}>
                                    {user.avatarUrl
                                        ? <img src={user.avatarUrl} alt={user.fullName || user.username || ''} className={styles.avatarImg} />
                                        : <span className={styles.avatarInitials}>{initials(user)}</span>
                                    }
                                </div>
                                <div className={styles.info}>
                                    <span className={styles.name}>{user.fullName || user.username || 'Unknown'}</span>
                                    {user.username && <span className={styles.username}>@{user.username}</span>}
                                </div>
                                <button
                                    className={styles.unblockBtn}
                                    onClick={e => { e.stopPropagation(); handleRemove(user.id); }}
                                    disabled={removing === user.id}
                                >
                                    {removing === user.id ? '…' : 'Remove'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
