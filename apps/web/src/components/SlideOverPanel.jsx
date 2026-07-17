import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './SlideOverPanel.module.css';

export default function SlideOverPanel({
    open,
    onClose,
    children,
    title,
    width = 480,
}) {
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') onClose?.();
    }, [onClose]);

    useEffect(() => {
        if (!open) return;
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [open, handleKeyDown]);

    if (!open) return null;

    const root = document.getElementById('modal-root') ?? document.body;

    return createPortal(
        <>
            <div className={styles.overlay} onClick={onClose} role="presentation" />
            <aside
                className={styles.panel}
                style={{ width: `${width}px` }}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                {title && (
                    <div className={styles.header}>
                        <h2 className={styles.title}>{title}</h2>
                        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
                            <X size={18} />
                        </button>
                    </div>
                )}
                <div className={styles.body}>{children}</div>
            </aside>
        </>,
        root,
    );
}
