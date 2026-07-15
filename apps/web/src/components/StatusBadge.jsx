import styles from './StatusBadge.module.css';

const ROLE_CONFIG = {
    admin:   { label: 'Admin',   className: 'admin' },
    user:    { label: 'User',    className: 'user' },
};

export default function StatusBadge({ status }) {
    const config = ROLE_CONFIG[status] || { label: status || 'user', className: 'user' };
    return <span className={`${styles.badge} ${styles[config.className]}`}>{config.label}</span>;
}
