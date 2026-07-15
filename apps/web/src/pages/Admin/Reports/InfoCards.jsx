import styles from './InfoCards.module.css';

export default function InfoCards() {
    return (
        <div className={styles.grid}>
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <IconLucideClipboardList size={16} />
                    <span>Report Overview</span>
                </div>
                <p>Reports help keep the community safe. Review them regularly and take appropriate action.</p>
                <a href="#" className={styles.link}>View guidelines <IconLucideExternalLink size={13} /></a>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <IconLucideInfo size={16} />
                    <span>Need more context?</span>
                </div>
                <p>Open a report to view full details, including message snapshots and publication previews.</p>
                <a href="#" className={styles.link}>Learn how reports work <IconLucideExternalLink size={13} /></a>
            </div>

            <div className={`${styles.card} ${styles.danger}`}>
                <div className={styles.cardHeader}>
                    <IconLucideAlertTriangle size={16} />
                    <span>Take action</span>
                </div>
                <p>You can warn, mute, kick or ban users depending on the severity of the report.</p>
                <a href="#" className={`${styles.link} ${styles.dangerLink}`}>Manage users <IconLucideExternalLink size={13} /></a>
            </div>
        </div>
    );
}