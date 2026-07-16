import styles from './StatCards.module.css';

export default function StatCards({ loading, reportsTotal, activeAccounts, activeTrades, publications }) {
    const fmt = (n) => {
        if (loading) return '—';
        if (n === null || n === undefined) return '—';
        return n.toLocaleString();
    };

    return (
        <div className={styles.row}>
            <div className={styles.card}>
                <div className={`${styles.iconWrap} ${styles.red}`}>
                    <IconLucideFlag size={18} />
                </div>
                <div className={styles.label}>Total Reports</div>
                <div className={styles.value}>{fmt(reportsTotal)}</div>
            </div>

            <div className={styles.card}>
                <div className={`${styles.iconWrap} ${styles.blue}`}>
                    <IconLucideUsers size={18} />
                </div>
                <div className={styles.label}>Active Accounts</div>
                <div className={styles.value}>{fmt(activeAccounts)}</div>
            </div>

            <div className={styles.card}>
                <div className={`${styles.iconWrap} ${styles.purple}`}>
                    <IconLucideArrowLeftRight size={18} />
                </div>
                <div className={styles.label}>Active Trades</div>
                <div className={styles.value}>{fmt(activeTrades)}</div>
            </div>

            <div className={styles.card}>
                <div className={`${styles.iconWrap} ${styles.green}`}>
                    <IconLucideBookOpen size={18} />
                </div>
                <div className={styles.label}>Publications</div>
                <div className={styles.value}>{fmt(publications)}</div>
            </div>
        </div>
    );
}