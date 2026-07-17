export const PUBLICATION_STATUS = Object.freeze({
    AVAILABLE: 'available',
    RESERVED: 'reserved',
    SWAPPED: 'swapped',
});

export const NEGOTIATION_STATUS = Object.freeze({
    ACCEPTED: 'accepted',
    PENDING: 'pending',
    DECLINED: 'declined',
    CANCELED: 'canceled',
    UNAVAILABLE: 'unavailable',
});


export const REPORT_TARGET_TYPE = {
    CHAT: 'chat',
    PUBLICATION: 'publication',
    ACCOUNT: 'account',
};

export const REPORT_STATUS = {
    PENDING: 'pending',
    ACTIONED: 'actioned',
    DISMISSED: 'dismissed',
};

const REPORT_REASON = {
    SPAM: 'spam',
    HARASSMENT: 'harassment',
    INAPPROPRIATE_CONTENT: 'inappropriate_content',
    SCAM_OR_FRAUD: 'scam_or_fraud',
    OTHER: 'other',
};

export const REPORT_REASON_LABELS = {
    [REPORT_REASON.SPAM]: 'Spam',
    [REPORT_REASON.HARASSMENT]: 'Harassment',
    [REPORT_REASON.INAPPROPRIATE_CONTENT]: 'Inappropriate Content',
    [REPORT_REASON.SCAM_OR_FRAUD]: 'Scam or Fraud',
    [REPORT_REASON.OTHER]: 'Other',
};

