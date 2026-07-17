import Modal from './Modal.jsx';
import Button from './Button.jsx';
import styles from './ConfirmDialog.module.css';

export default function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false,
    busy = false,
}) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <Button variant="secondary" fullWidth={false} onClick={onClose} disabled={busy}>
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={danger ? 'danger' : 'primary'}
                        fullWidth={false}
                        onClick={onConfirm}
                        disabled={busy}
                    >
                        {confirmLabel}
                    </Button>
                </>
            }
        >
            {message && <p className={styles.message}>{message}</p>}
        </Modal>
    );
}
