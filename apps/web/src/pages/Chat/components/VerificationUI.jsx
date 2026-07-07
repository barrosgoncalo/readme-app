import { useState } from 'react';
import styles from './VerificationUI.module.css';

export default function VerificationUI({ code, displayerId, scannerId, currentUserId, onComplete, error, busy }) {
    const [inputCode, setInputCode] = useState('');
    const isDisplayer = currentUserId === displayerId;
    const isScanner = currentUserId === scannerId;

    if (!isDisplayer && !isScanner) return null;

    if (isDisplayer) {
        return (
            <div className={styles.verification}>
                <p className={styles.prompt}>Show this code at the swap:</p>
                <div className={styles.codeDisplay}>{code}</div>
                <p className={styles.hint}>Share this code with the other person to verify the swap.</p>
            </div>
        );
    }

    if (isScanner) {
        return (
            <div className={styles.verification}>
                <p className={styles.prompt}>Enter the verification code:</p>
                <div className={styles.inputGroup}>
                    <input
                        type="text"
                        placeholder="Enter code"
                        value={inputCode}
                        onChange={(e) => {
                            setInputCode(e.target.value);
                        }}
                        className={styles.codeInput}
                        disabled={busy}
                        autoCapitalize="characters"
                    />
                    <button
                        onClick={() => onComplete(inputCode)}
                        disabled={!inputCode.trim() || busy}
                        className={styles.confirmBtn}
                    >
                        {busy ? 'Verifying...' : 'Confirm'}
                    </button>
                </div>
                {error && <p className={styles.error}>{error}</p>}
            </div>
        );
    }

    return null;
}
