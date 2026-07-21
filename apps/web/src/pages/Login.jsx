import {useState} from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Field from '../components/Field.jsx';
import Button from '../components/Button.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import GoogleIcon from '../components/GoogleIcon.jsx';
import {doSignInWithEmailAndPassword, doSignInWithGoogle,} from '@readme/shared/src/services/auth';
import {WEB_ROUTES} from '../constants/webRoutes';

const loginBg = '/login-bg.jpeg';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || WEB_ROUTES.EXPLORE;

    async function onSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await doSignInWithEmailAndPassword(email, password);
            navigate(from, {replace: true});
        } catch {
            setError('Failed to log in. Check your data.');
            setSubmitting(false);
        }
    }

    async function onGoogle() {
        setSubmitting(true);
        setError('');
        try {
            const { user, isNewUser } = await doSignInWithGoogle();
            if (isNewUser) {
                navigate('/register', {
                    replace: true,
                    state: { googleUser: { uid: user.uid, email: user.email, fullName: user.displayName || '' } },
                });
            } else {
                navigate(from, { replace: true });
            }
        } catch (err) {
            setError(err.message || 'Failed to authenticate with Google.');
            setSubmitting(false);
        }
    }

    return (
        <AuthLayout
            title="Sign in"
            subtitle="Welcome back."
            bgImage={loginBg}
            footer={
                <span>
                    No account yet? <Link to="/register">Sign up</Link>
                </span>
            }
        >
            <form onSubmit={onSubmit} style={{display: 'flex', flexDirection: 'column', gap: 'var(--space-3)'}}>
                <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required/>
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
                <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                    <GoogleIcon/>
                    Continue with Google
                </span>
            </Button>

            <div style={{textAlign: 'center', fontSize: '0.9rem'}}>
                <Link to="/forgot-password">Forgot password?</Link>
            </div>
        </AuthLayout>
    );
}
