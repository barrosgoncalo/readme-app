import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '../components/Toast.module.css';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef(new Map());

    const dismiss = useCallback((id) => {
        clearTimeout(timersRef.current.get(id));
        timersRef.current.delete(id);
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message, options = {}) => {
        const { variant = 'default', duration = 3500 } = options;
        const id = ++toastId;

        setToasts(prev => [...prev, { id, message, variant }]);
        timersRef.current.set(id, setTimeout(() => dismiss(id), duration));
    }, [dismiss]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {createPortal(
                <div className={styles.stack} aria-live="polite" aria-relevant="additions">
                    {toasts.map(({ id, message, variant }) => (
                        <div key={id} className={`${styles.toast} ${styles[variant] || ''}`} role="status">
                            {message}
                        </div>
                    ))}
                </div>,
                document.body,
            )}
        </ToastContext.Provider>
    );
}

export function useToastContext() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToastContext must be used within ToastProvider');
    }
    return ctx;
}

/** Drop-in replacement for the legacy useToast hook — returns [toast, showToast] for gradual migration. */
export function useToast(duration = 3500) {
    const { showToast: contextShow } = useToastContext();
    const [toast, setToast] = useState('');

    const showToast = useCallback((message, options = {}) => {
        contextShow(message, { ...options, duration: options.duration ?? duration });
        setToast(message);
        setTimeout(() => setToast(''), options.duration ?? duration);
    }, [contextShow, duration]);

    return [toast, showToast];
}
