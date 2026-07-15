import { useState } from 'react';
import { REPORT_TARGET_TYPE, REPORT_REASON_LABELS, REPORT_STATUS } from '@readme/shared/src/constants/status';
import StatusBadge from '../../components/StatusBadge';
import styles from './ReportRow.module.css';

const TARGET_ICON = {
    [REPORT_TARGET_TYPE.CHAT]: <IconLucideMessageCircle size={18} />,
    [REPORT_TARGET_TYPE.PUBLICATION]: <IconLucideBookmark size={18} />,
    [REPORT_TARGET_TYPE.ACCOUNT]: <IconLucideUserCircle2 size={18} />,
};

const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const truncateId = (id) => {
    if (!id) return '—';
    return id.length > 15 ? `${id.slice(0, 15)}...` : id;
};

const targetLabel = (report, reportedUser) => {
    switch (report.targetType) {
        case REPORT_TARGET_TYPE.CHAT:
            return { title: 'Chat', sub: `with @${reportedUser?.username || '—'}` };
        case REPORT_TARGET_TYPE.PUBLICATION:
            return { 
                title: 'Publication', 
                sub: `ID: ${truncateId(report.targetId)}`,
                fullId: report.targetId // NEW: Pass the full ID
            };
        case REPORT_TARGET_TYPE.ACCOUNT:
            return { title: 'Account', sub: `@${reportedUser?.username || '—'}` };
        default:
            return { 
                title: report.targetType, 
                sub: truncateId(report.targetId),
                fullId: report.targetId // NEW: Pass the full ID
            };
    }
};

const reportSubtitle = (report) => {
    switch (report.targetType) {
        case REPORT_TARGET_TYPE.CHAT:
            return 'Chat between users';
        case REPORT_TARGET_TYPE.PUBLICATION:
            return report.contextSnapshot?.title ? `${report.contextSnapshot.title}` : 'Publication report';
        case REPORT_TARGET_TYPE.ACCOUNT:
            return 'User profile';
        default:
            return '';
    }
};

export default function ReportRow({ report, reporter, reportedUser, onStatusChange }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const target = targetLabel(report, reportedUser);

    const handleCopy = async (text) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy ID:', err);
        }
    };

    return (
        <tr className={styles.row}>
            <td>
                <div className={styles.reportCell}>
                    <div className={styles.reportIcon}>{TARGET_ICON[report.targetType]}</div>
                    <div>
                        <div className={styles.reportTitle}>{REPORT_REASON_LABELS[report.reason] || report.reason}</div>
                        <div className={styles.reportSub}>{reportSubtitle(report)}</div>
                    </div>
                </div>
            </td>
            <td>
                <div className={styles.personCell}>
                    <div className={styles.avatar}>{reporter?.username?.[0]?.toUpperCase() || '?'}</div>
                    <div>
                        <div className={styles.personName}>{reporter?.fullName || reporter?.username || 'Unknown'}</div>
                        <div className={styles.personHandle}>@{reporter?.username || '—'}</div>
                    </div>
                </div>
            </td>
            <td>
                <div className={styles.personCell}>
                    <div className={styles.avatar}>{reportedUser?.username?.[0]?.toUpperCase() || '?'}</div>
                    <div>
                        <div className={styles.personName}>{reportedUser?.fullName || reportedUser?.username || 'Unknown'}</div>
                        <div className={styles.personHandle}>@{reportedUser?.username || '—'}</div>
                    </div>
                </div>
            </td>
            <td>
                <div className={styles.targetCell}>
                    <div className={styles.personName}>{target.title}</div>
                    <div 
                        className={styles.personHandle}
                        title={target.fullId && !copied ? `Copy full ID: ${target.fullId}` : undefined}
                        onClick={target.fullId && !copied ? () => handleCopy(target.fullId) : undefined}
                        style={target.fullId ? { cursor: copied ? 'default' : 'pointer' } : {}}
                    >
                        {copied ? (
                            <span style={{ color: '#10b981', fontWeight: 500 }}>✅ Copied!</span>
                        ) : (
                            target.sub
                        )}
                    </div>
                </div>
            </td>
            <td className={styles.reasonCell}>{REPORT_REASON_LABELS[report.reason] || report.reason}</td>
            <td><StatusBadge status={report.status} /></td>
            <td className={styles.dateCell}>{formatDate(report.createdAt)}</td>
            <td>
                <div className={styles.actionsCell}>
                    <button type="button" className={styles.iconBtn}>
                        <IconLucideEye size={16} />
                    </button>
                    <div className={styles.menuWrap}>
                        <button type="button" className={styles.iconBtn} onClick={() => setMenuOpen((o) => !o)}>
                            <IconLucideMoreVertical size={16} />
                        </button>
                        {menuOpen && (
                            <div className={styles.menu}>
                                <button type="button" onClick={() => { onStatusChange(report.id, REPORT_STATUS.REVIEWED); setMenuOpen(false); }}>
                                    Mark reviewed
                                </button>
                                <button type="button" onClick={() => { onStatusChange(report.id, REPORT_STATUS.ACTIONED); setMenuOpen(false); }}>
                                    Mark actioned
                                </button>
                                <button type="button" onClick={() => { onStatusChange(report.id, REPORT_STATUS.DISMISSED); setMenuOpen(false); }}>
                                    Dismiss
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </td>
        </tr>
    );
}
