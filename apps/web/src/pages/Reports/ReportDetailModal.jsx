import {useEffect} from 'react';
import {REPORT_TARGET_TYPE, REPORT_REASON_LABELS} from '@readme/shared/src/constants/status';
import StatusBadge from '../../components/StatusBadge.jsx';
import styles from './ReportDetailModal.module.css';

const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatMessageTime = (createdAt) => {
    if (!createdAt) return '';
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'});
};

function ChatSnapshot({snapshot}) {
    const messages = snapshot?.recentMessages || [];
    return (
        <div className={styles.chatBox}>
            <div className={styles.chatHeader}>
                <div className={styles.avatar}>
                    {snapshot?.otherUserAvatar
                        ? <img src={snapshot.otherUserAvatar} alt="" className={styles.avatarImg}/>
                        : (snapshot?.otherUserName?.[0]?.toUpperCase() || '?')
                    }
                </div>
                <span>Conversation with {snapshot?.otherUserName || 'Swapper'}</span>
            </div>
            {messages.length === 0 ? (
                <p className={styles.emptyNote}>No messages captured in this report.</p>
            ) : (
                <div className={styles.messageList}>
                    {messages.map((m, i) => (
                        <div key={i} className={styles.messageRow}>
                            <span className={styles.messageSender}>{m.senderId ? m.senderId.slice(0, 8) : '—'}</span>
                            <p className={styles.messageText}>{m.type === 'offer' ? `[Offer] ${m.text}` : m.text}</p>
                            <span className={styles.messageTime}>{formatMessageTime(m.createdAt)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function PublicationSnapshot({snapshot}) {
    return (
        <div className={styles.pubBox}>
            {snapshot?.images?.[0] && (
                <img src={snapshot.images[0]} alt="" className={styles.pubImage}/>
            )}
            <div className={styles.pubInfo}>
                <div className={styles.pubTitle}>{snapshot?.title || 'Unknown Title'}</div>
                <div className={styles.pubMeta}>by {snapshot?.author || 'Unknown Author'}</div>
                <div className={styles.pubMeta}>Seller: {snapshot?.sellerName || 'Anonymous Swapper'}</div>
                {snapshot?.detailsText && (
                    <p className={styles.pubDesc}>{snapshot.detailsText}</p>
                )}
            </div>
        </div>
    );
}

function AccountSnapshot({snapshot}) {
    return (
        <div className={styles.accountBox}>
            <div className={styles.avatar} style={{width: 44, height: 44}}>
                {snapshot?.avatarUrl
                    ? <img src={snapshot.avatarUrl} alt="" className={styles.avatarImg}/>
                    : (snapshot?.username?.[0]?.toUpperCase() || '?')
                }
            </div>
            <span>Reported account: @{snapshot?.username || 'Anonymous Swapper'}</span>
        </div>
    );
}

const SNAPSHOT_COMPONENTS = {
    [REPORT_TARGET_TYPE.CHAT]: ChatSnapshot,
    [REPORT_TARGET_TYPE.PUBLICATION]: PublicationSnapshot,
    [REPORT_TARGET_TYPE.ACCOUNT]: AccountSnapshot,
};

export default function ReportDetailModal({report, reporter, reportedUser, onClose, onStatusChange}) {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!report) return null;

    const SnapshotComponent = SNAPSHOT_COMPONENTS[report.targetType];

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div>
                        <div className={styles.title}>{REPORT_REASON_LABELS[report.reason] || report.reason}</div>
                        <div className={styles.subtitle}>Reported {formatDate(report.createdAt)}</div>
                    </div>
                    <button type="button" className={styles.closeBtn} onClick={onClose}>
                        <IconLucideX size={18}/>
                    </button>
                </div>

                <div className={styles.body}>
                    <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>Status</span>
                        <StatusBadge status={report.status}/>
                    </div>
                    <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>Target type</span>
                        <span className={styles.metaValue}>{report.targetType}</span>
                    </div>
                    <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>Report count</span>
                        <span className={styles.metaValue}>{report.reportCount ?? 1}</span>
                    </div>

                    <div className={styles.peopleRow}>
                        <div className={styles.personBlock}>
                            <span className={styles.metaLabel}>Reporter</span>
                            <div
                                className={styles.personName}>{reporter?.fullName || reporter?.username || 'Unknown'}</div>
                            <div className={styles.personHandle}>@{reporter?.username || '—'}</div>
                        </div>
                        <div className={styles.personBlock}>
                            <span className={styles.metaLabel}>Reported user</span>
                            <div
                                className={styles.personName}>{reportedUser?.fullName || reportedUser?.username || 'Unknown'}</div>
                            <div className={styles.personHandle}>@{reportedUser?.username || '—'}</div>
                        </div>
                    </div>

                    <div className={styles.sectionTitle}>Context</div>
                    {SnapshotComponent
                        ? <SnapshotComponent snapshot={report.contextSnapshot}/>
                        : <p className={styles.emptyNote}>No context available for this report type.</p>
                    }
                </div>

                <div className={styles.footer}>
                    <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => onStatusChange(report.id, 'actioned')}
                    >
                        Mark actioned
                    </button>
                    <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.dismissBtn}`}
                        onClick={() => onStatusChange(report.id, 'dismissed')}
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
}
