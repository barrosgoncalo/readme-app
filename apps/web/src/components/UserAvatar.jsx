import styles from './UserAvatar.module.css';

export default function UserAvatar({ user }) {
    const photoURL = user?.photoURL || user?.avatarUrl;
    const displayName = user?.fullName || user?.username || '';
    return (
        <div className={styles.avatar}>
            <img
                src={photoURL || '/bookworm.png'}
                alt={displayName}
                className={styles.avatarImg}
                onError={e => { e.currentTarget.src = '/bookworm.png'; }}
            />
        </div>
    );
}
