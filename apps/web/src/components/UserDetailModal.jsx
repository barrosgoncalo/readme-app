import styles from './UserDetailModal.module.css';

const formatDate = (value) => {
    if (!value) return '—';
    const date = value.toDate ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function UserDetailModal({ user, onClose }) {
    if (!user) return null;

    const address = user.institutionalAddress || {};
    const addressLine = [address.city, address.district, address.country].filter(Boolean).join(', ');

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.identity}>
                        <div className={styles.avatar}>
                            {user.photoURL
                                ? <img src={user.photoURL} alt="" className={styles.avatarImg} />
                                : <IconLucideUser size={22} />
                            }
                        </div>
                        <div>
                            <div className={styles.name}>{user.fullName || user.username || 'Unnamed User'}</div>
                            {user.username && <div className={styles.handle}>@{user.username}</div>}
                        </div>
                    </div>
                    <button type="button" className={styles.closeBtn} onClick={onClose}>
                        <IconLucideX size={18} />
                    </button>
                </div>

                <div className={styles.body}>
                    <div className={styles.row}>
                        <span className={styles.label}>Email</span>
                        <span className={styles.value}>{user.userId || user.email || '—'}</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Role</span>
                        <span className={styles.value}>{user.role || 'user'}</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Phone</span>
                        <span className={styles.value}>{user.phoneNumber || '—'}</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Location</span>
                        <span className={styles.value}>{addressLine || '—'}</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Account status</span>
                        <span className={styles.value}>{user.accountStatus || '—'}</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Visibility</span>
                        <span className={styles.value}>{user.profileVisibility || '—'}</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Rating</span>
                        <span className={styles.value}>{user.rating ?? 0} ({user.reviewCount ?? 0} reviews)</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Completed swaps</span>
                        <span className={styles.value}>{user.gamification?.completedSwapsCount ?? 0}</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Rank</span>
                        <span className={styles.value}>{user.gamification?.rank || '—'}</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Auth provider</span>
                        <span className={styles.value}>{user.authProvider || '—'}</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Joined</span>
                        <span className={styles.value}>{formatDate(user.createdAt)}</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>UID</span>
                        <span className={styles.value}>{user.uid}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
