import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import QuickActionModal from './QuickActionModal.jsx';
import styles from './QuickActionModal.module.css';

export default function BannedUsersModal({ onClose }) {
    const [bannedUsers, setBannedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unbanning, setUnbanning] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const db = getFirestore();
        getDocs(query(collection(db, 'users'), where('accountStatus', '==', 'banned')))
            .then(snap => setBannedUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() }))))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleUnban = async (user) => {
        setUnbanning(user.uid);
        setError('');
        try {
            const db = getFirestore();
            await updateDoc(doc(db, 'users', user.uid), { accountStatus: 'active' });
            setBannedUsers(prev => prev.filter(u => u.uid !== user.uid));
        } catch (err) {
            setError(err.message || 'Failed to unban user.');
        } finally {
            setUnbanning(null);
        }
    };

    return (
        <QuickActionModal onClose={onClose} title="Banned Users">
            <div className={styles.body}>
                {loading ? (
                    <p className={styles.empty}>Loading…</p>
                ) : bannedUsers.length === 0 ? (
                    <p className={styles.empty}>No banned users.</p>
                ) : (
                    bannedUsers.map(user => (
                        <div key={user.uid} className={styles.userRow} style={{ cursor: 'default' }}>
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
                                <div className={styles.userMeta}>{user.userId || user.email || '—'}</div>
                            </div>
                            <button
                                type="button"
                                className={styles.btnGhost}
                                style={{ fontSize: 12, padding: '5px 12px', flexShrink: 0 }}
                                onClick={() => handleUnban(user)}
                                disabled={unbanning === user.uid}
                            >
                                {unbanning === user.uid ? 'Unbanning…' : 'Unban'}
                            </button>
                        </div>
                    ))
                )}
                {error && <p className={styles.errorMsg}>{error}</p>}
            </div>
        </QuickActionModal>
    );
}
