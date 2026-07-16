import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import styles from './ChartCard.module.css';

export default function PublicationsByDateChart({ data = [], loading }) {
    if (loading) return <div className={styles.placeholder}>Loading…</div>;

    const total = data.reduce((sum, d) => sum + d.count, 0);
    if (total === 0) {
        return <div className={styles.placeholder}>No publications in this period.</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAECF0" />
                <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#667085' }}
                    interval="preserveStartEnd"
                    tickMargin={8}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#667085' }} width={36} />
                <Tooltip cursor={{ stroke: '#17A34A', strokeWidth: 1 }} />
                <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#17A34A"
                    strokeWidth={2}
                    fill="#17A34A"
                    fillOpacity={0.12}
                    dot={{ r: 3, fill: '#17A34A', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}