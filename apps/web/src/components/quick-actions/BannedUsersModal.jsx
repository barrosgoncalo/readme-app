import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { DB } from '@readme/shared/src/services/DB';
import { unbanUserAccount } from '@readme/shared/src/services/admin';
import QuickActionModal from './QuickActionModal.jsx';
import styles from './QuickActionModal.module.css';

export default function BannedUsersModal({ onClose }) {
    const [bannedUsers, setBannedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unbanning, setUnbanning] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        DB.get('banned', [])
            .then(users => {
                if (isMounted) setBannedUsers(users);
            })
            .catch(err => {
                console.error("Erro a carregar banidos:", err);
                if (isMounted) setError("Não foi possível carregar os utilizadores. Verifica as regras do Firestore.");
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => isMounted = false;
    }, []);

    const handleUnban = async (user) => {
        const targetUid = user.id || user.uid;
        setUnbanning(targetUid);
        setError('');

        try {
            await unbanUserAccount(targetUid);
            setBannedUsers(prev => prev.filter(u => (u.id || u.uid) !== targetUid));
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
                    <p className={styles.empty}>Loading...</p>
                ) : bannedUsers.length === 0 ? (
                    <p className={styles.empty}>No banned users.</p>
                ) : (
                    bannedUsers.map(user => (
                        <div key={user.id || user.uid} className={styles.userRow} style={{ cursor: 'default' }}>
                            <div className={styles.avatar}>
                                {user.photoURL
                                    ? <img src={user.photoURL} alt="" className={styles.avatarImg} />
                                    : <User size={16} />
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
                                disabled={unbanning === (user.id || user.uid)}
                            >
                                {unbanning === (user.id || user.uid) ? 'Unbanning...' : 'Unban'}
                            </button>
                        </div>
                    ))
                )}
                {error && <p className={styles.errorMsg}>{error}</p>}
            </div>
        </QuickActionModal>
    );
}