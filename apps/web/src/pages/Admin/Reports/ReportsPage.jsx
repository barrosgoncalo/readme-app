import { useState } from 'react';
import { useAdminReports } from '@readme/shared/src/hooks/use-admin-reports';
import { Download } from 'lucide-react';
import { REPORT_REASON_LABELS } from '@readme/shared/src/constants/status';
import Pagination from '../../../components/Pagination.jsx';
import ReportStatCards from './ReportsStatCards.jsx';
import ReportsFilterBar from './ReportsFilterBar.jsx';
import ReportsTable from './ReportsTable.jsx';
import ReportDetailModal from './ReportDetailModal.jsx';
import styles from './Reports.module.css';


const escapeCsvCell = (value) => {
    const str = String(value ?? '');
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

const formatDateForCsv = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toISOString();
};

const REPORT_CSV_COLUMNS = [
    {header: 'Report ID', get: (r) => r.id},
    {header: 'Reason', get: (r) => REPORT_REASON_LABELS[r.reason] || r.reason},
    {header: 'Reporter Username', get: (r, userMap) => userMap[r.reporterId]?.username || ''},
    {header: 'Reporter Full Name', get: (r, userMap) => userMap[r.reporterId]?.fullName || ''},
    {header: 'Reported Username', get: (r, userMap) => userMap[r.reportedUserId]?.username || ''},
    {header: 'Reported Full Name', get: (r, userMap) => userMap[r.reportedUserId]?.fullName || ''},
    {header: 'Target Type', get: (r) => r.targetType || ''},
    {header: 'Target ID', get: (r) => r.targetId || ''},
    {header: 'Status', get: (r) => r.status || ''},
    {header: 'Created At', get: (r) => formatDateForCsv(r.createdAt)},
];

const exportReportsToCsv = (reports, userMap) => {
    const rows = [
        REPORT_CSV_COLUMNS.map((c) => c.header),
        ...reports.map((r) => REPORT_CSV_COLUMNS.map((c) => escapeCsvCell(c.get(r, userMap)))),
    ];
    const csv = rows.map((row) => row.join(',')).join('\r\n');
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reports-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
};

export default function AdminReports() {
    const [status, setStatus] = useState(null);
    const [targetType, setTargetType] = useState(null);
    const [reason, setReason] = useState(null);
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [viewReport, setViewReport] = useState(null);

    const { reports, userMap, stats, total, totalPages, loading, setReportStatus } = useAdminReports({
        status,
        targetType,
        reason,
        search,
        dateFrom,
        dateTo,
        page,
        pageSize,
    });

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Reports</h1>
                    <p className={styles.subtitle}>Review and manage user reports from the platform.</p>
                </div>
                <button type="button" className={styles.exportBtn} onClick={() => exportReportsToCsv(reports, userMap)}>
                    <Download size={16} />
                    Export Reports
                </button>
            </div>

            <ReportStatCards stats={stats} />

            <ReportsFilterBar
                search={search}
                onSearchChange={(v) => { setSearch(v); setPage(1); }}
                status={status}
                onStatusChange={(v) => { setStatus(v); setPage(1); }}
                targetType={targetType}
                onTargetTypeChange={(v) => { setTargetType(v); setPage(1); }}
                reason={reason}
                onReasonChange={(v) => { setReason(v); setPage(1); }}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateChange={(from, to) => { setDateFrom(from); setDateTo(to); setPage(1); }}
            />

            <div className={styles.tableCard}>
                <ReportsTable reports={reports} userMap={userMap} loading={loading} onStatusChange={setReportStatus} onView={setViewReport} />
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                />
            </div>

            {viewReport && (
                <ReportDetailModal
                    report={viewReport}
                    reporter={userMap[viewReport.reporterId]}
                    reportedUser={userMap[viewReport.reportedUserId]}
                    onClose={() => setViewReport(null)}
                    onStatusChange={(id, newStatus) => {
                        setReportStatus(id, newStatus);
                        setViewReport(null);
                    }}
                />
            )}
        </div>
    );
}

