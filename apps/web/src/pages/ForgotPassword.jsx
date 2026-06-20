import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Field from '../components/Field.jsx';
import Button from '../components/Button.jsx';
import { doPasswordReset } from '@readme/shared/src/services/auth.web';

const ForgotPassBg = '/login-bg.jpeg';

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
        <AuthLayout
            title="Reset password"
            bgImage={ForgotPassBg}
            subtitle={sent ? 'Check your inbox for the reset link.' : 'Enter your account email.'}
            footer={
                <span>
                    Remembered it? <Link to="/login">Sign in</Link>
                </span>
            }
        >
            {!sent && (
                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
                    {error && <div role="alert" style={{ color: '#D32F2F', fontSize: '0.9rem' }}>{error}</div>}
                    <Button type="submit" disabled={submitting}>
                        {submitting ? 'Sending…' : 'Send reset email'}
                    </Button>
                </form>
            )}
            {sent && (
                <Link to="/login" style={{ width: '100%' }}>
                    <Button>Back to sign in</Button>
                </Link>
            )}
        </AuthLayout>
    );
}
