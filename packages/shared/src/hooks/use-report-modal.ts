// apps/mobile/src/hooks/use-report-modal.ts

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { ReportsService } from '@readme/shared/src/services/reports';
import type { ReportReasonId } from '@readme/shared/src/constants/reportReasons';

type OpenArgs = {
    reporterId: string;
    targetType: string;
    targetId: string;
    reportedUserId: string;
    /** Pre-built via ReportsService.buildChatSnapshot / buildPublicationSnapshot / buildAccountSnapshot */
    contextSnapshot: Record<string, unknown>;
};

/**
 * Replaces an `Alert.alert(title, message, [...N buttons])` reason picker
 * (Android caps Alert at 3 buttons, so this was breaking with 5 reasons).
 *
 * Usage:
 *   const report = useReportModal();
 *   ...
 *   report.open({ reporterId, targetType: 'publication', targetId, reportedUserId, contextSnapshot });
 *   ...
 *   <ReportModal visible={report.visible} {...report.modalProps} />
 */
export const useReportModal = () => {
    const [visible, setVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [target, setTarget] = useState<OpenArgs | null>(null);

    const open = useCallback((args: OpenArgs) => {
        setTarget(args);
        setVisible(true);
    }, []);

    const close = useCallback(() => {
        if (submitting) return; // avoid dismissing mid-submit
        setVisible(false);
        setTarget(null);
    }, [submitting]);

    const handleSubmit = useCallback(
        async ({ reasonId }: { reasonId: ReportReasonId }) => {
            if (!target) return;

            setSubmitting(true);
            try {
                await ReportsService.submitReport(
                    target.reporterId,
                    target.targetType,
                    target.targetId,
                    target.reportedUserId,
                    reasonId,
                    target.contextSnapshot,
                );
                setVisible(false);
                setTarget(null);
                Alert.alert('Report submitted', 'Thanks — our team will take a look.');
            } catch (error) {
                console.error('[useReportModal] submitReport failed:', error);
                Alert.alert('Something went wrong', "We couldn't submit your report. Please try again.");
            } finally {
                setSubmitting(false);
            }
        },
        [target],
    );
    return {
        visible,
        open,
        close,
        submitting,
        modalProps: {
            onClose: close,
            onSubmit: handleSubmit,
            submitting,
        },
    };
};