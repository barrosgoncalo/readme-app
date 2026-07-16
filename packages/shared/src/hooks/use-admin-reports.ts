import { useEffect, useMemo, useState } from 'react';
import { ReportsService } from '../services/reports';
import { UsersService } from '../services/users';
import { REPORT_STATUS } from '../constants/status';

const isThisMonth = (timestamp) => {
    if (!timestamp) return false;
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

/**
 * Admin Reports data hook. Subscribes in real-time (status/targetType filtered
 * server-side), resolves reporter/reportedUser display info, and applies
 * search/reason/date filtering + pagination client-side.
 *
 * NOTE: UsersService.getUsersByIds() currently returns only { username, fullName } —
 * no photoURL. Avatars fall back to initials until that's added. Flagging this
 * rather than changing the service silently.
 */
export function useAdminReports({ status, targetType, reason, search, dateFrom, dateTo, page, pageSize }) {
    const [rawReports, setRawReports] = useState([]);
    const [userMap, setUserMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = ReportsService.subscribeToReports(
            (reports) => {
                setRawReports(reports);
                setLoading(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
            },
            { status: status || undefined, targetType: targetType || undefined }
        );
        return unsubscribe;
    }, [status, targetType]);

    // Resolve reporter + reportedUser display info for whatever's currently loaded.
    useEffect(() => {
        const ids = new Set();
        rawReports.forEach((r) => {
            if (r.reporterId) ids.add(r.reporterId);
            if (r.reportedUserId) ids.add(r.reportedUserId);
        });
        // @ts-ignore
        const missing = [...ids].filter((id) => !userMap[id]);
        if (missing.length === 0) return;

        UsersService.fetchAllUsersProfile(missing).then((map) => {
            setUserMap((prev) => ({ ...prev, ...map }));
        });
    }, [rawReports]);

    const filtered = useMemo(() => {
        return rawReports.filter((r) => {
            if (reason && r.reason !== reason) return false;

            if (dateFrom || dateTo) {
                const created = r.createdAt?.toDate ? r.createdAt.toDate() : r.createdAt ? new Date(r.createdAt) : null;
                if (!created) return false;
                if (dateFrom && created < dateFrom) return false;
                if (dateTo && created > dateTo) return false;
            }

            if (search) {
                const q = search.toLowerCase();
                const reporter = userMap[r.reporterId];
                const reported = userMap[r.reportedUserId];
                const haystack = [
                    r.reason,
                    r.targetType,
                    r.targetId,
                    reporter?.username,
                    reporter?.fullName,
                    reported?.username,
                    reported?.fullName,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                if (!haystack.includes(q)) return false;
            }

            return true;
        });
    }, [rawReports, reason, search, dateFrom, dateTo, userMap]);

    const stats = useMemo(() => {
        return {
            total: rawReports.length,
            pending: rawReports.filter((r) => r.status === REPORT_STATUS.PENDING).length,
            resolved: rawReports.filter(
                (r) => (r.status === REPORT_STATUS.REVIEWED || r.status === REPORT_STATUS.ACTIONED) && isThisMonth(r.updatedAt)
            ).length,
            dismissed: rawReports.filter((r) => r.status === REPORT_STATUS.DISMISSED && isThisMonth(r.updatedAt)).length,
        };
    }, [rawReports]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

    const setReportStatus = async (reportId, newStatus) => {
        await ReportsService.updateReportStatus(reportId, newStatus);
    };

    return {
        reports: paged,
        userMap,
        stats,
        total: filtered.length,
        totalPages,
        loading,
        error,
        setReportStatus,
    };
}
