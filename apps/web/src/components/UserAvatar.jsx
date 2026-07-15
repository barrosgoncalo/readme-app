import styles from './UserAvatar.module.css';

function initials(user) {
    const name = user?.fullName || user?.username || '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

export default function UserAvatar({ user }) {
    const photoURL = user?.photoURL || user?.avatarUrl;
    const displayName = user?.fullName || user?.username || '';
    return (
        <div className={styles.avatar}>
            {photoURL
                ? <img src={photoURL} alt={displayName} className={styles.avatarImg} />
                : <span className={styles.avatarInitials}>{initials(user)}</span>}
        </div>
    );
}
