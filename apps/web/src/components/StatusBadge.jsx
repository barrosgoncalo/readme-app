import { REPORT_STATUS } from '@readme/shared/src/constants/status';
import styles from './StatusBadge.module.css';

const STATUS_CONFIG = {
    [REPORT_STATUS.PENDING]: { label: 'Pending', className: 'pending' },
    [REPORT_STATUS.REVIEWED]: { label: 'Resolved', className: 'resolved' },
    [REPORT_STATUS.ACTIONED]: { label: 'Resolved', className: 'resolved' },
    [REPORT_STATUS.DISMISSED]: { label: 'Dismissed', className: 'dismissed' },
};

export default function StatusBadge({ status }) {
    const config = STATUS_CONFIG[status] || { label: status, className: 'pending' };
    return <span className={`${styles.badge} ${styles[config.className]}`}>{config.label}</span>;
}