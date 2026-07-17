import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function Modal({
    open,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    showClose = true,
    closeOnOverlay = true,
    portalRoot,
}) {
    const panelRef = useRef(null);
    const previousFocusRef = useRef(null);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose?.();
            return;
        }
        if (e.key !== 'Tab' || !panelRef.current) return;

        const focusable = [...panelRef.current.querySelectorAll(FOCUSABLE)];
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }, [onClose]);

    useEffect(() => {
        if (!open) return;

        previousFocusRef.current = document.activeElement;
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => {
            const focusable = panelRef.current?.querySelectorAll(FOCUSABLE);
            if (focusable?.length) focusable[0].focus();
            else panelRef.current?.focus();
        });

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
            previousFocusRef.current?.focus?.();
        };
    }, [open, handleKeyDown]);

    if (!open) return null;

    const root = portalRoot ?? document.getElementById('modal-root') ?? document.body;

    return createPortal(
        <div
            className={styles.overlay}
            onClick={closeOnOverlay ? onClose : undefined}
            role="presentation"
        >
            <div
                ref={panelRef}
                className={`${styles.panel} ${styles[size]}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
            >
                {(title || showClose) && (
                    <div className={styles.header}>
                        {title && <h2 id="modal-title" className={styles.title}>{title}</h2>}
                        {showClose && (
                            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
                                <X size={18} />
                            </button>
                        )}
                    </div>
                )}
                <div className={styles.body}>{children}</div>
                {footer && <div className={styles.footer}>{footer}</div>}
            </div>
        </div>,
        root,
    );
}
