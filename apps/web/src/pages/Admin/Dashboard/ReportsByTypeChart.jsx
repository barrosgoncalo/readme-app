import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { REPORT_REASON_LABELS } from '@readme/shared/src/constants/status';
import styles from './ChartCard.module.css';

const COLORS = ['#6366F1', '#F59E0B', '#17A34A', '#EF4444', '#06B6D4', '#A855F7'];

export default function ReportsByTypeChart({ data = [], loading }) {
    if (loading) return <div className={styles.placeholder}>Loading…</div>;

    const total = data.reduce((sum, d) => sum + d.count, 0);

    if (total === 0) {
        return <div className={styles.placeholder}>No reports yet.</div>;
    }

    const chartData = data
        .filter((d) => d.count > 0)
        .map((d) => ({ name: REPORT_REASON_LABELS[d.reason] || d.reason, value: d.count }));

    return (
        <ResponsiveContainer width="100%" height={450}>
            <PieChart>
                <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={0}
                    outerRadius={125}
                    paddingAngle={0}
                >
                    {chartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value, name) => [`${value} (${((value / total) * 100).toFixed(1)}%)`, name]}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
        </ResponsiveContainer>
    );
}