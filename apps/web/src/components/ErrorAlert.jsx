import { AlertCircle } from 'lucide-react';
import styles from './ErrorAlert.module.css';

export default function ErrorAlert({ children }) {
    if (!children) return null;
    return (
        <div role="alert" className={styles.alert}>
            <AlertCircle size={16} className={styles.icon} aria-hidden />
            <span className={styles.message}>{children}</span>
        </div>
    );
}
