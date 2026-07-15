import { Bell as IconLucideBell } from 'lucide-react';
import ProfileDropdown from './ProfileDropdown'; // <-- Here is the import!
import styles from './AdminTopbar.module.css';

export default function AdminTopbar() {
    return (
        <header className={styles.topbar}>
            <div />
            <div className={styles.actions}>
                <button type="button" className={styles.iconBtn}>
                    <IconLucideBell size={18} />
                </button>
                
                {/* Replaces the hardcoded profile wrapper */}
                <ProfileDropdown />
            </div>
        </header>
    );
}
