import { useEffect } from 'react';
import styles from './QuickActionModal.module.css';

export default function QuickActionModal({ onClose, title, children, wide }) {
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={`${styles.panel} ${wide ? styles.wide : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.header}>
                    <span className={styles.title}>{title}</span>
                    <button type="button" className={styles.closeBtn} onClick={onClose}>
                        <IconLucideX size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
