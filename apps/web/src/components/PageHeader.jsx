import { ArrowLeft } from 'lucide-react';
import styles from './PageHeader.module.css';

export default function PageHeader({ onBack, title, right }) {
    return (
        <div className={styles.header}>
            <button className={styles.backBtn} onClick={onBack} aria-label="Back">
                <ArrowLeft size={20} />
            </button>
            {title && <h1 className={styles.title}>{title}</h1>}
            {right && <div className={styles.right}>{right}</div>}
        </div>
    );
}
