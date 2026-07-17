import Button from './Button.jsx';
import styles from './EmptyState.module.css';

export default function EmptyState({ icon: Icon, title, message, actionLabel, onAction }) {
    return (
        <div className={styles.empty}>
            {Icon && (
                <div className={styles.iconWrap}>
                    <Icon size={32} aria-hidden />
                </div>
            )}
            {title && <p className={styles.title}>{title}</p>}
            {message && <p className={styles.message}>{message}</p>}
            {actionLabel && onAction && (
                <div className={styles.action}>
                    <Button onClick={onAction}>{actionLabel}</Button>
                </div>
            )}
        </div>
    );
}
