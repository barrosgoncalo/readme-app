import { useState, useEffect, useRef } from 'react';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import QuickActionModal from './QuickActionModal.jsx';
import UserDetailModal from '../UserDetailModal.jsx';
import styles from './QuickActionModal.module.css';

export default function SearchUsersModal({ onClose }) {
    const [allUsers, setAllUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [viewUser, setViewUser] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const db = getFirestore();
        getDocs(query(collection(db, 'users'), orderBy('fullName')))
            .then(snap => setAllUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() }))))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!loading) inputRef.current?.focus();
    }, [loading]);

    const filtered = search.trim()
        ? allUsers.filter(u => {
            const q = search.toLowerCase();
            return (
                (u.fullName || '').toLowerCase().includes(q) ||
                (u.username || '').toLowerCase().includes(q) ||
                (u.userId || u.email || '').toLowerCase().includes(q)
            );
        })
        : allUsers.slice(0, 20);

    if (viewUser) {
        return <UserDetailModal user={viewUser} onClose={() => setViewUser(null)} />;
    }

    return (
        <QuickActionModal onClose={onClose} title="Search Users">
            <div className={styles.searchBox}>
                <input
                    ref={inputRef}
                    className={styles.searchInput}
                    placeholder="Search by name, username, or email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <div className={styles.body}>
                {loading ? (
                    <p className={styles.empty}>Loading…</p>
                ) : filtered.length === 0 ? (
                    <p className={styles.empty}>No users found.</p>
                ) : (
                    filtered.map(user => (
                        <div
                            key={user.uid}
                            className={styles.userRow}
                            onClick={() => setViewUser(user)}
                        >
                            <div className={styles.avatar}>
                                {user.photoURL
                                    ? <img src={user.photoURL} alt="" className={styles.avatarImg} />
                                    : <IconLucideUser size={16} />
                                }
                            </div>
                            <div className={styles.userInfo}>
                                <div className={styles.userName}>
                                    {user.fullName || user.username || 'Unnamed User'}
                                    {user.username && <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>@{user.username}</span>}
                                </div>
                                <div className={styles.userMeta}>{user.userId || user.email || '—'}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </QuickActionModal>
    );
}
