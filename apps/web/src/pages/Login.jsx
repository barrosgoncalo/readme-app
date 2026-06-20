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

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
    );
}

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
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <GoogleIcon />
                    Continue with Google
                </span>
            </Button>
            <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
                <Link to="/forgot-password">Forgot password?</Link>
            </div>
        </AuthLayout>
    );
}
