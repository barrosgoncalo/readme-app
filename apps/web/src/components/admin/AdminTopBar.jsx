import styles from './AdminTopBar.module.css';

export default function AdminTopbar() {
    return (
        <header className={styles.topbar}>
            <div />
            <div className={styles.actions}>
                <button type="button" className={styles.iconBtn}>
                    <IconLucideBell size={18} />
                </button>
                <div className={styles.profile}>
                    <div className={styles.avatar}>
                        <IconLucideUser size={16} />
                    </div>
                    <span>Admin</span>
                    <IconLucideChevronDown size={16} />
                </div>
            </div>
        </header>
    );
}
