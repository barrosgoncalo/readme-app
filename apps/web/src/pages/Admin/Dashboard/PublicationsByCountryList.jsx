import styles from './PublicationsByCountryList.module.css';

const DOT_COLORS = ['#17A34A', '#6366F1', '#F59E0B', '#06B6D4', '#EF4444', '#A855F7', '#84CC16', '#EC4899', '#0EA5E9', '#F97316'];

export default function PublicationsByCountryList({ data = [], loading }) {
    if (loading) return <div className={styles.placeholder}>Loading…</div>;
    if (data.length === 0) return <div className={styles.placeholder}>No publications yet.</div>;

    const total = data.reduce((sum, d) => sum + d.count, 0);
    const top = data.slice(0, 10);

    return (
        <ul className={styles.list}>
            {top.map((item, i) => {
                const pct = total ? (item.count / total) * 100 : 0;
                const color = DOT_COLORS[i % DOT_COLORS.length];
                return (
                    <li key={item.country} className={styles.row}>
                        <span className={styles.dot} style={{ background: color }} />
                        <span className={styles.country}>{item.country}</span>
                        <span className={styles.barTrack}>
                            <span className={styles.barFill} style={{ width: `${pct}%`, background: color }} />
                        </span>
                        <span className={styles.count}>{item.count.toLocaleString()}</span>
                        <span className={styles.pct}>{pct.toFixed(1)}%</span>
                    </li>
                );
            })}
        </ul>
    );
}