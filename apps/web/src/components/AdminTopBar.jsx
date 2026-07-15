import ProfileDropdown from './ProfileDropdown';
import styles from './AdminTopbar.module.css';

export default function AdminTopbar() {
    return (
        <header className={styles.topbar}>
            <div />
            <div className={styles.actions}>
                
                <ProfileDropdown />
            </div>
        </header>
    );
}
