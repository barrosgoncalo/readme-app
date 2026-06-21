import { useState } from 'react';
import { Link } from 'react-router-dom';
import { doPasswordReset } from '@readme/shared/src/services/auth.web';
import styles from './ForgotPassword.module.css';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [sent, setSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await doPasswordReset(email);
            setSent(true);
        } catch (err) {
            setError(err.message || 'Could not send reset email.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className={styles.shell}>
            <div className={styles.card}>
                <div className={styles.left}>
                    <div>
                        <p className={styles.badge}>Recovery</p>
                        <h1 className={styles.heading}>Reset Password</h1>
                    </div>

                    {!sent ? (
                        <>
                            <p className={styles.description}>
                                Enter the email address associated with your account and we'll send you a link to reset your password.
                            </p>
                            <form onSubmit={onSubmit} className={styles.form}>
                                <input
                                    className={styles.input}
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                />
                                {error && <p className={styles.error}>{error}</p>}
                                <button type="submit" className={styles.btn} disabled={submitting}>
                                    {submitting ? 'Sending…' : 'Send Reset Link'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <p className={styles.success}>
                            Check your inbox — a reset link is on its way to <strong>{email}</strong>.
                        </p>
                    )}

                    <div className={styles.footer}>
                        Remembered it? <Link to="/login">Back to sign in</Link>
                    </div>
                </div>

                <div className={styles.right}>
                    <img src="/recovery-worm.png" alt="" className={styles.illustration} />
                </div>
            </div>
        </div>
    );
}
