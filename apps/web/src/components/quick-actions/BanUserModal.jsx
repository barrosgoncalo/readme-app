import { useState, useEffect, useRef } from 'react';
import { getFirestore, collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import QuickActionModal from './QuickActionModal.jsx';
import styles from './QuickActionModal.module.css';

export default function BanUserModal({ onClose }) {
    const [allUsers, setAllUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [banning, setBanning] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        const db = getFirestore();
        getDocs(query(collection(db, 'users'), orderBy('fullName')))
            .then(snap => setAllUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() }))))
            .catch(console.error)
            .finally(() => {
                setLoading(false);
                setTimeout(() => inputRef.current?.focus(), 50);
            });
    }, []);

    const filtered = search.trim()
        ? allUsers.filter(u => {
            const q = search.toLowerCase();
            return (
                (u.fullName || '').toLowerCase().includes(q) ||
                (u.username || '').toLowerCase().includes(q) ||
                (u.userId || u.email || '').toLowerCase().includes(q)
            );
        }).slice(0, 8)
        : [];

    const handleBan = async () => {
        if (!selected) return;
        setBanning(true);
        setError('');
        try {
            const db = getFirestore();
            await updateDoc(doc(db, 'users', selected.uid), { accountStatus: 'banned' });
            setAllUsers(prev => prev.map(u => u.uid === selected.uid ? { ...u, accountStatus: 'banned' } : u));
            setSuccess(`${selected.fullName || selected.username || 'User'} has been banned.`);
            setSelected(null);
            setSearch('');
            setTimeout(onClose, 2000);
        } catch (err) {
            setError(err.message || 'Failed to ban user.');
        } finally {
            setBanning(false);
        }
    };

    return (
        <QuickActionModal onClose={onClose} title="Ban User">
            {!selected ? (
                <>
                    <div className={styles.searchBox}>
                        <input
                            ref={inputRef}
                            className={styles.searchInput}
                            placeholder="Search user by name, username, or email…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className={styles.body}>
                        {loading ? (
                            <p className={styles.empty}>Loading…</p>
                        ) : !search.trim() ? (
                            <p className={styles.empty}>Type to search for a user.</p>
                        ) : filtered.length === 0 ? (
                            <p className={styles.empty}>No users found.</p>
                        ) : (
                            filtered.map(user => (
                                <div
                                    key={user.uid}
                                    className={styles.userRow}
                                    onClick={() => user.accountStatus !== 'banned' && setSelected(user)}
                                    style={user.accountStatus === 'banned' ? { opacity: 0.5, cursor: 'default' } : {}}
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
                                        </div>
                                        <div className={styles.userMeta}>
                                            {user.userId || user.email || '—'}
                                            {user.accountStatus === 'banned' && ' · Already banned'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {success && <p className={styles.successMsg}>{success}</p>}
                </>
            ) : (
                <>
                    <div className={styles.body}>
                        <div className={styles.userRow} style={{ cursor: 'default', padding: '20px' }}>
                            <div className={styles.avatar} style={{ width: 48, height: 48 }}>
                                {selected.photoURL
                                    ? <img src={selected.photoURL} alt="" className={styles.avatarImg} />
                                    : <IconLucideUser size={20} />
                                }
                            </div>
                            <div className={styles.userInfo}>
                                <div className={styles.userName} style={{ fontSize: 15 }}>
                                    {selected.fullName || selected.username || 'Unnamed User'}
                                </div>
                                <div className={styles.userMeta}>
                                    {selected.userId || selected.email || '—'}
                                </div>
                                <div className={styles.userMeta} style={{ marginTop: 4, color: '#374151' }}>
                                    Role: {selected.role || 'user'} · UID: {selected.uid}
                                </div>
                            </div>
                        </div>
                        <p style={{ margin: '0 20px 16px', fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                            Banning this account will set their status to <strong>banned</strong>. They will still be able to log in but their access can be restricted at the app level.
                        </p>
                        {error && <p className={styles.errorMsg}>{error}</p>}
                    </div>
                    <div className={styles.footer}>
                        <button type="button" className={styles.btnGhost} onClick={() => setSelected(null)}>
                            Back
                        </button>
                        <button type="button" className={styles.btnDanger} onClick={handleBan} disabled={banning}>
                            {banning ? 'Banning…' : 'Ban Account'}
                        </button>
                    </div>
                </>
            )}
        </QuickActionModal>
    );
}
