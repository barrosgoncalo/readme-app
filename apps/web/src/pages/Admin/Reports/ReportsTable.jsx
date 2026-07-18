import {useState, useEffect} from 'react';
import ReportRow from './ReportRow.jsx';
import styles from './ReportsTable.module.css';

export default function ReportsTable({reports, userMap, loading, onStatusChange, onView}) {
    const [openMenuId, setOpenMenuId] = useState(null);

    useEffect(() => {
        const closeMenu = () => setOpenMenuId(null);
        document.addEventListener('click', closeMenu);
        return () => document.removeEventListener('click', closeMenu);
    }, []);

    if (loading)
        return <div className={styles.empty}>Loading reports...</div>;

    if (reports.length === 0)
        return <div className={styles.empty}>No reports match these filters.</div>;

    return (
        <div className={styles.scroll}>
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
                    <th className={styles.actionsCol}>Actions</th>
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
                        onView={onView}
                        isOpen={openMenuId === report.id}
                        onToggleMenu={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === report.id ? null : report.id);
                        }}
                    />
                ))}
                </tbody>
            </table>
        </div>
    );
}
