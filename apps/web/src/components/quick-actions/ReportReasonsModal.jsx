import { REPORT_REASON_LABELS } from '@readme/shared/src/constants/status';
import QuickActionModal from './QuickActionModal.jsx';
import styles from './QuickActionModal.module.css';
import localStyles from './ReportReasonsModal.module.css';

const DESCRIPTIONS = {
    spam: 'Repetitive, unsolicited, or commercially motivated content.',
    harassment: 'Targeted abuse, threats, or hostile behavior toward another user.',
    inappropriate_content: 'Content that violates community guidelines or is offensive.',
    scam_or_fraud: 'Deceptive listings, false offers, or attempts to defraud another user.',
    other: 'Issues that do not fall under any of the categories above.',
};

export default function ReportReasonsModal({ onClose }) {
    return (
        <QuickActionModal onClose={onClose} title="Report Reasons">
            <div className={styles.body}>
                {Object.entries(REPORT_REASON_LABELS).map(([key, label]) => (
                    <div key={key} className={localStyles.reasonRow}>
                        <div className={localStyles.reasonLabel}>{label}</div>
                        <div className={localStyles.reasonKey}>{key}</div>
                        <div className={localStyles.reasonDesc}>{DESCRIPTIONS[key] || ''}</div>
                    </div>
                ))}
            </div>
        </QuickActionModal>
    );
}
