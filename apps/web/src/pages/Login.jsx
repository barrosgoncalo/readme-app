import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';

const loginBg = '/login-bg.jpeg';
import Field from '../components/Field.jsx';
import Button from '../components/Button.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import {
    doSignInWithEmailAndPassword,
    doSignInWithGoogle,
} from '@readme/shared/src/services/auth.web';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = location.state?.from || '/books';

    async function onSubmit(e) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await doSignInWithEmailAndPassword(email, password);
            navigate(redirectTo, { replace: true });
        } catch (err) {
            setError(err.message || 'Could not sign in.');
        } finally {
            setSubmitting(false);
        }
    }

    async function onGoogle() {
        setError(null);
        setSubmitting(true);
        try {
            await doSignInWithGoogle();
            navigate(redirectTo, { replace: true });
        } catch (err) {
            setError(err.message || 'Google sign-in failed.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <AuthLayout
            title="Sign in"
            subtitle="Welcome back."
            heroBg={loginBg}
            footer={
                <span>
                    No account yet? <Link to="/register">Sign up</Link>
                </span>
            }
        >
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
                <Field
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    autoComplete="current-password"
                    required
                />
                <ErrorAlert>{error}</ErrorAlert>
                <Button type="submit" disabled={submitting}>
                    {submitting ? 'Signing in…' : 'Sign in'}
                </Button>
            </form>
            <Button variant="ghost" onClick={onGoogle} disabled={submitting}>
                Continue with Google
            </Button>
            <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
                <Link to="/forgot-password">Forgot password?</Link>
            </div>
        </AuthLayout>
    );
}
