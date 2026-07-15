import { REPORT_TARGET_TYPE, REPORT_REASON_LABELS, REPORT_STATUS } from '@readme/shared/src/constants/status';
import StatusBadge from '../../../components/StatusBadge.jsx';
import ReportRow from './ReportRow.jsx';
import styles from './ReportsTable.module.css';

export default function ReportsTable({ reports, userMap, loading, onStatusChange }) {
    if (loading) {
        return <div className={styles.empty}>Loading reports…</div>;
    }

    if (reports.length === 0) {
        return <div className={styles.empty}>No reports match these filters.</div>;
    }

    return (
        <table className={styles.table}>
            <thead>
            <tr>
                <th>Report</th>
                <th>Reporter</th>
                <th>Reported User</th>
                <th>Target</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
            </tr>
            </thead>
            <tbody>
            {reports.map((report) => (
                <ReportRow
                    key={report.id}
                    report={report}
                    reporter={userMap[report.reporterId]}
                    reportedUser={userMap[report.reportedUserId]}
                    onStatusChange={onStatusChange}
                />
            ))}
            </tbody>
        </table>
    );
}
