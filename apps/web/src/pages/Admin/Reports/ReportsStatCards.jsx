import styles from './ReportsStatCards.module.css';

const CARDS = [
    { key: 'total', label: 'Total Reports', sub: 'All time', icon: <IconLucideFlag size={20} />, tone: 'blue' },
    { key: 'pending', label: 'Pending', sub: 'Require attention', icon: <IconLucideClock size={20} />, tone: 'amber' },
    { key: 'resolved', label: 'Resolved', sub: 'This month', icon: <IconLucideCheckCircle2 size={20} />, tone: 'green' },
    { key: 'dismissed', label: 'Dismissed', sub: 'This month', icon: <IconLucideBan size={20} />, tone: 'red' },
];

export default function ReportStatCards({ stats }) {
    return (
        <div className={styles.grid}>
            {CARDS.map((card) => (
                <div key={card.key} className={styles.card}>
                    <div className={`${styles.iconWrap} ${styles[card.tone]}`}>{card.icon}</div>
                    <div>
                        <div className={styles.value}>{stats[card.key] ?? 0}</div>
                        <div className={styles.label}>{card.label}</div>
                        <div className={styles.sub}>{card.sub}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}