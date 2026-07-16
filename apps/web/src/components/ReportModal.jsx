import { useState } from 'react';
import { REPORT_REASON_LABELS } from '@readme/shared/src/constants/status';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import styles from './ReportModal.module.css';

export default function ReportModal({ open, onClose, onSubmit, title = 'Report' }) {
    const [reason, setReason] = useState(null);
    const [busy, setBusy] = useState(false);

    async function handleSubmit() {
        if (!reason || busy) return;
        setBusy(true);
        try {
            await onSubmit(reason);
            setReason(null);
            onClose();
        } finally {
            setBusy(false);
        }
    }

    function handleClose() {
        if (busy) return;
        setReason(null);
        onClose();
    }

    return (
        <Modal open={open} onClose={handleClose} title={title} size="sm">
            <p className={styles.prompt}>Why are you reporting this?</p>
            <div className={styles.reasonList}>
                {Object.entries(REPORT_REASON_LABELS).map(([value, label]) => (
                    <label key={value} className={styles.reasonOption}>
                        <input
                            type="radio"
                            name="report-reason"
                            value={value}
                            checked={reason === value}
                            onChange={() => setReason(value)}
                            disabled={busy}
                        />
                        {label}
                    </label>
                ))}
            </div>
            <Button onClick={handleSubmit} disabled={!reason || busy}>
                {busy ? 'Submitting...' : 'Submit Report'}
            </Button>
        </Modal>
    );
}
