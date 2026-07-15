import { REPORT_TARGET_TYPE, REPORT_STATUS, REPORT_REASON_LABELS } from '@readme/shared/src/constants/status';
import Dropdown from '../../components/Dropdown';
import styles from './ReportsFilterBar.module.css';

const STATUS_OPTIONS = [
    { value: REPORT_STATUS.PENDING, label: 'Pending' },
    { value: REPORT_STATUS.REVIEWED, label: 'Reviewed' },
    { value: REPORT_STATUS.ACTIONED, label: 'Actioned' },
    { value: REPORT_STATUS.DISMISSED, label: 'Dismissed' },
];

const TARGET_TYPE_OPTIONS = [
    { value: REPORT_TARGET_TYPE.CHAT, label: 'Chat' },
    { value: REPORT_TARGET_TYPE.PUBLICATION, label: 'Publication' },
    { value: REPORT_TARGET_TYPE.ACCOUNT, label: 'Account' },
];

const REASON_OPTIONS = Object.entries(REPORT_REASON_LABELS).map(([value, label]) => ({ value, label }));

export default function ReportsFilterBar({
                                             search, onSearchChange,
                                             status, onStatusChange,
                                             targetType, onTargetTypeChange,
                                             reason, onReasonChange,
                                         }) {
    return (
        <div className={styles.bar}>
            <div className={styles.searchWrap}>
                <IconLucideSearch size={16} className={styles.searchIcon} />
                <input
                    className={styles.searchInput}
                    placeholder="Search reports..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div className={styles.filters}>
                <Dropdown value={status} onChange={onStatusChange} options={STATUS_OPTIONS} allLabel="All Status" />
                <Dropdown value={targetType} onChange={onTargetTypeChange} options={TARGET_TYPE_OPTIONS} allLabel="All Target Types" />
                <Dropdown value={reason} onChange={onReasonChange} options={REASON_OPTIONS} allLabel="All Reasons" />
            </div>
        </div>
    );
}
