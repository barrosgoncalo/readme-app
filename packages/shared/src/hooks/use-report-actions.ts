import {useState, useCallback} from 'react';
import {ReportsService} from '../services/reports';
import {REPORT_TARGET_TYPE} from '../constants/status';

export function useReportActions() {
    const [isProcessingReports, setIsProcessingReports] = useState(false);

    const autoActionPublicationReports = useCallback(async (pubId: string) => {
        setIsProcessingReports(true);
        try {
            await ReportsService.actionReportsByTarget(REPORT_TARGET_TYPE.PUBLICATION, pubId);
            console.log(`[useReportActions] Cleaned up reports for publication ${pubId}`);
        } catch (error) {
            console.error("Failed to auto-action publication reports:", error);
        } finally {
            setIsProcessingReports(false);
        }
    }, []);

    const autoActionUserReports = useCallback(async (userId: string) => {
        setIsProcessingReports(true);
        try {
            await ReportsService.actionAllReportsForUser(userId);
            console.log(`[useReportActions] Cleaned up reports for user ${userId}`);
        } catch (error) {
            console.error("Failed to auto-action user reports:", error);
        } finally {
            setIsProcessingReports(false);
        }
    }, []);

    return {
        autoActionPublicationReports,
        autoActionUserReports,
        isProcessingReports
    };
}
