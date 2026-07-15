// @readme/shared/src/models/report.js

import { REPORT_STATUS } from '../constants/status';

export const getReportId = (reporterId, targetType, targetId) => {
    return `${reporterId}_${targetType}_${targetId}`;
};

export const createReportModel = (
    reporterId,
    targetType,
    targetId,
    reportedUserId,
    reason,
    contextSnapshot = {}
) => {
    return {
        reporterId,
        targetType,
        targetId,
        reportedUserId,

        reason,
        contextSnapshot,

        status: REPORT_STATUS.PENDING,

        reportCount: 1,

        createdAt: null,
        updatedAt: null,
    };
};