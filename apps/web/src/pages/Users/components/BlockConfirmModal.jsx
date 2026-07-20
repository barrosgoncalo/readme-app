import { UserX, X } from 'lucide-react';
import styles from './BlockConfirmModal.module.css';

export default function BlockConfirmModal({ open, onClose, onConfirm, username, loading }) {
    if (!open) return null;

    const displayName = username ? `@${username}` : 'this user';

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby="block-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={onClose}
                    aria-label="Close"
                    disabled={loading}
                >
                    <X size={18} />
                </button>

                <div className={styles.iconWrap}>
                    <UserX size={26} />
                </div>

                <h2 id="block-modal-title" className={styles.title}>
                    Block {displayName}?
                </h2>
                <p className={styles.text}>
                    You won&rsquo;t see each other&rsquo;s books, publications, or reviews anymore,
                    and {displayName} won&rsquo;t be notified.
                </p>

                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={styles.confirmBtn}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Blocking…' : 'Block'}
                    </button>
                </div>
            </div>
        </div>
    );
}