import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import styles from './ChartCard.module.css';

export default function AccountsByRankChart({ data = [], loading }) {
    if (loading) return <div className={styles.placeholder}>Loading…</div>;

    const total = data.reduce((sum, d) => sum + d.count, 0);
    if (total === 0) {
        return <div className={styles.placeholder}>No active accounts yet.</div>;
    }

    // Keep the milestone order (Novice -> Legendary) rather than sorting
    // by count, so the progression reads left-to-right/top-to-bottom.
    const chartData = data;

    return (
        <ResponsiveContainer width="100%" height={500}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EAECF0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#667085' }} />
                <YAxis
                    type="category"
                    dataKey="rank"
                    width={150}
                    interval={0}
                    tick={{ fontSize: 15, fill: '#344054' }}
                />
                <Tooltip cursor={{ fill: '#F9FAFB' }} />
                <Bar dataKey="count" fill="#e7ab51" radius={[0, 6, 6, 0]} maxBarSize={22} />
            </BarChart>
        </ResponsiveContainer>
    );
}