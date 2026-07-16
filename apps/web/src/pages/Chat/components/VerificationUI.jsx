import { useState } from 'react';
import ActionCard from './ActionCard.jsx';
import styles from './VerificationUI.module.css';

export default function VerificationUI({ code, displayerId, scannerId, currentUserId, onComplete, error, busy }) {
    const [inputCode, setInputCode] = useState('');
    const isDisplayer = currentUserId === displayerId;
    const isScanner = currentUserId === scannerId;

    if (!isDisplayer && !isScanner) return null;

    if (isDisplayer) {
        return (
            <ActionCard prompt="Show this code at the swap:">
                <div className={styles.codeDisplay}>{code}</div>
                <p className={styles.hint}>Share this code with the other person to verify the swap.</p>
            </ActionCard>
        );
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!inputCode.trim() || busy) return;
        onComplete(inputCode);
    }

    return (
        <ActionCard prompt="Enter the verification code:">
            <form className={styles.inputGroup} onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Enter code"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    className={styles.codeInput}
                    disabled={busy}
                    autoCapitalize="characters"
                />
                <button
                    type="submit"
                    disabled={!inputCode.trim() || busy}
                    className={styles.confirmBtn}
                >
                    {busy ? 'Verifying...' : 'Confirm'}
                </button>
            </form>
            {error && <p className={styles.error}>{error}</p>}
        </ActionCard>
    );
}
