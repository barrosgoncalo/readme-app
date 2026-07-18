import { useState } from 'react';
import { User } from 'lucide-react';
import styles from './UserAvatar.module.css';

export default function UserAvatar({ user }) {
    const [imgFailed, setImgFailed] = useState(false);
    const photoURL = user?.photoURL || user?.avatarUrl;
    const displayName = user?.fullName || user?.username || '';

    return (
        <div className={styles.avatar}>
            {photoURL && !imgFailed ? (
                <img
                    src={photoURL}
                    alt={displayName}
                    className={styles.avatarImg}
                    onError={() => setImgFailed(true)}
                />
            ) : (
                <User className={styles.avatarIcon} aria-label={displayName} />
            )}
        </div>
    );
}
