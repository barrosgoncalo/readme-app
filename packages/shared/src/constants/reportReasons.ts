// @readme/shared/src/constants/reportReasons.ts

/**
 * Static metadata for each report reason. `id` is what gets persisted as
 * `reason` on the report doc (see models/report.js), so treat these ids as
 * stable — don't rename them once reports exist in Firestore.
 */
export type ReportReasonId =
    | 'spam'
    | 'harassment'
    | 'inappropriate_content'
    | 'scam_or_fraud'
    | 'other';

export type ReportReason = {
    id: ReportReasonId;
    title: string;
    subtitle: string;
    icon: string;
    /** Base hex color the icon + its tinted background are derived from. */
    accentColor: string;
};

export const REPORT_REASONS: ReportReason[] = [
    {
        id: 'inappropriate_content',
        title: 'Inappropriate content',
        subtitle: 'Contains offensive or harmful content',
        icon: 'lucide:alert-triangle',
        accentColor: '#D32F2F',
    },
    {
        id: 'scam_or_fraud',
        title: 'Item not as described',
        subtitle: 'The item is different from the listing',
        icon: 'lucide:package',
        accentColor: '#F58B2E',
    },
    {
        id: 'spam',
        title: 'Spam or misleading',
        subtitle: 'Fake, repetitive or misleading listing',
        icon: 'lucide:tag',
        accentColor: '#D4A017',
    },
    {
        id: 'harassment',
        title: 'Seller misconduct',
        subtitle: 'Rude, abusive or unresponsive behavior',
        icon: 'lucide:user',
        accentColor: '#3B3561',
    },
    {
        id: 'other',
        title: 'Other',
        subtitle: 'Something else not listed above',
        icon: 'lucide:more-horizontal',
        accentColor: '#3D8B5F',
    },
];

/** Convenience lookup, e.g. for rendering a saved report in the admin app. */
export const REPORT_REASONS_BY_ID: Record<ReportReasonId, ReportReason> =
    REPORT_REASONS.reduce((acc, reason) => {
        acc[reason.id] = reason;
        return acc;
    }, {} as Record<ReportReasonId, ReportReason>);