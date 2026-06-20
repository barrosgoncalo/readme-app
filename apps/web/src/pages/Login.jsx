import {useState} from 'react';
import {Link, useNavigate, useLocation} from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Field from '../components/Field.jsx';
import Button from '../components/Button.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import {
    doSignInWithEmailAndPassword,
    doSignInWithGoogle,
} from '@readme/shared/src/services/auth.web';

// A tua imagem de fundo.
// Como começa por '/', o Vite vai procurar um ficheiro 'login-bg.jpeg' dentro da pasta 'apps/web/public/'
const loginBg = '/login-bg.jpeg';

// Ícone do Google
function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#4285F4"/>
            <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-3.239-2.518c-.806.54-1.836.86-2.717.86-2.092 0-3.863-1.41-4.493-3.308H.242v2.593C1.724 16.368 5.127 18 9 18z"
                fill="#34A853"/>
            <path
                d="M4.507 10.854c-.161-.482-.253-.997-.253-1.528 0-.531.092-1.046.253-1.528V5.205H.242C.087 5.82 0 6.47 0 7.142s.087 1.322.242 1.937l4.265-3.43z"
                fill="#FBBC05"/>
            <path
                d="M9 3.58c1.137 0 2.158.391 2.961 1.155l2.222-2.222C12.71 1.053 11.026.333 9 .333 5.127.333 1.724 1.965.242 4.908l4.265 3.308C5.137 4.99 6.908 3.58 9 3.58z"
                fill="#EA4335"/>
        </svg>
    );
}

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Quando o login tiver sucesso, manda-nos para o /profile (ou a página de onde o user vinha)
    const from = location.state?.from?.pathname || '/profile';

    async function onSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await doSignInWithEmailAndPassword(email, password);
            navigate(from, {replace: true});
        } catch {
            setError('Falha ao iniciar sessão. Verifica os teus dados.');
            setSubmitting(false);
        }
    }

    async function onGoogle() {
        setSubmitting(true);
        setError('');
        try {
            await doSignInWithGoogle();
            navigate(from, {replace: true});
        } catch {
            setError('Falha na autenticação com o Google.');
            setSubmitting(false);
        }
    }

    return (
        <AuthLayout
            title="Sign in"
            subtitle="Welcome back."
            bgImage={loginBg} /* AQUI APLICAMOS A PROPRIEDADE CORRETA */
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