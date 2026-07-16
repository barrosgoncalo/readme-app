import { useState } from 'react';
import { useAdminReports } from '@readme/shared/src/hooks/use-admin-reports';
import Pagination from '../../../components/Pagination.jsx';
import ReportStatCards from './ReportsStatCards.jsx';
import ReportsFilterBar from './ReportsFilterBar.jsx';
import ReportsTable from './ReportsTable.jsx';
import ReportDetailModal from './ReportDetailModal.jsx';
import InfoCards from './InfoCards.jsx';
import styles from './Reports.module.css';

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
                <button type="button" className={styles.exportBtn}>
                    <IconLucideDownload size={16} />
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

            <InfoCards />

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

