// @readme/shared/src/services/reports.js

import { increment } from 'firebase/firestore';
import { createReportModel, getReportId } from '../models/report';
import { REPORT_STATUS } from '../constants/status';
import { DB } from './DB';

const REPORTS_COLLECTION = 'reports';
const MAX_SNAPSHOT_MESSAGES = 25;
const MAX_MESSAGE_TEXT_LENGTH = 400;

const _getMessageTime = (m) => m.createdAt?.toMillis?.() ?? m.clientTimestamp ?? 0;

const _formatMessageForSnapshot = (m) => {
    const rawText = m.type === 'offer' ? (m.text || 'Sent an offer') : (m.text || '');
    const text = rawText.length > MAX_MESSAGE_TEXT_LENGTH
        ? `${rawText.slice(0, MAX_MESSAGE_TEXT_LENGTH)}…`
        : rawText;

    return {
        senderId: m.senderId,
        type: m.type,
        text,
        createdAt: m.createdAt || m.clientTimestamp || null,
    };
};

export const ReportsService = {

    /**
     * Builds the contextSnapshot for a chat report: the last N messages,
     * oldest to newest, trimmed and with offer payloads collapsed to a
     * short summary.
     */
    buildChatSnapshot: (messages = [], otherUser = {}) => {
        const sorted = [...messages].sort((a, b) => _getMessageTime(a) - _getMessageTime(b));
        const recent = sorted.slice(-MAX_SNAPSHOT_MESSAGES);

        return {
            otherUserName: otherUser?.name || otherUser?.username || 'Swapper',
            otherUserAvatar: otherUser?.avatarUrl || otherUser?.photoURL || null,
            recentMessages: recent.map(_formatMessageForSnapshot),
        };
    },

    /**
     * Builds the contextSnapshot for a publication report.
     */
    buildPublicationSnapshot: (publication = {}) => {
        const detailsText = publication?.detailsText || "";

        return {
            title: publication?.book?.title || "Unknown Title",
            image: publication?.book?.images?.[0] || null,
            sellerName: publication?.sellerName || "Anonymous Swapper",
            detailsText: detailsText.length > MAX_MESSAGE_TEXT_LENGTH
                ? `${detailsText.slice(0, MAX_MESSAGE_TEXT_LENGTH)}…`
                : detailsText,
        };
    },

    /**
     * Builds the contextSnapshot for an account report.
     */
    buildAccountSnapshot: (targetUser = {}) => {
        return {
            username: targetUser?.username || targetUser?.fullName || "Anonymous Swapper",
            avatarUrl: targetUser?.photoURL || null,
        };
    },

    /**
     * Submits a report. First submission from a reporter on a target creates
     * the doc; any later submission on the same target updates it in place
     * (refreshes reason/description/context, resets status to pending, bumps reportCount).
     */
    submitReport: async (reporterId, targetType, targetId, reportedUserId, reason, contextSnapshot = {}) => {
        const reportId = getReportId(reporterId, targetType, targetId);
        const existing = await DB.get(REPORTS_COLLECTION, reportId);

        if (existing) {
            await DB.update(REPORTS_COLLECTION, reportId, {
                reason,
                contextSnapshot,
                status: REPORT_STATUS.PENDING,
                reportCount: increment(1),
            }, true);
            return reportId;
        }

        const payload = createReportModel(reporterId, targetType, targetId, reportedUserId, reason, contextSnapshot);
        await DB.create(REPORTS_COLLECTION, payload, reportId);
        return reportId;
    },

    /**
     * Checks if a reporter already has a report on file for this target.
     * Useful for showing "you already reported this" state in the UI.
     */
    getExistingReport: async (reporterId, targetType, targetId) => {
        const reportId = getReportId(reporterId, targetType, targetId);
        return await DB.get(REPORTS_COLLECTION, reportId);
    },

    /**
     * Fetches reports, optionally filtered by status and/or targetType.
     * For the admin page.
     */
    fetchReports: async (filters = {}) => {
        const conditions = [];
        if (filters.status) conditions.push({ field: 'status', operator: '==', value: filters.status });
        if (filters.targetType) conditions.push({ field: 'targetType', operator: '==', value: filters.targetType });

        return await DB.get(REPORTS_COLLECTION, conditions);
    },

    /**
     * Subscribes to reports in real-time, optionally filtered by status.
     * For the admin page.
     */
    subscribeToReports: (onUpdate, onError, filters = {}) => {
        const conditions = [];
        if (filters.status) conditions.push({ field: 'status', operator: '==', value: filters.status });
        if (filters.targetType) conditions.push({ field: 'targetType', operator: '==', value: filters.targetType });

        return DB.subscribeQuery(REPORTS_COLLECTION, conditions, onUpdate, onError);
    },

    /**
     * Updates a report's status (e.g. reviewed, actioned, dismissed).
     * For the admin page.
     */
    updateReportStatus: async (reportId, newStatus) => {
        await DB.update(REPORTS_COLLECTION, reportId, { status: newStatus }, true);
    },
};