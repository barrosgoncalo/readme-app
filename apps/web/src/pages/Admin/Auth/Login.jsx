import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doSignInWithEmailAndPassword } from '@readme/shared/src/services/auth';
import styles from './Login.module.css';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await doSignInWithEmailAndPassword(email, password);

            if (result.userData?.role === 'admin') {
                navigate('/admin', { replace: true });
            } else {
                setError('Access denied. You do not have administrative privileges.');
            }
        } catch (err) {
            setError(err.message || 'Invalid credentials. Please verify your administrative access.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <form onSubmit={handleSubmit} className={styles.card}>
                <div className={styles.logo}>
                    <IconLucideBookOpen size={22} />
                    <span>SwapBooks Admin</span>
                </div>
                <p className={styles.subtitle}>Sign in to manage the platform.</p>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.field}>
                    <label className={styles.label} htmlFor="email">Email Address</label>
                    <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.input}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label} htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.input}
                    />
                </div>

                <button type="submit" disabled={loading} className={styles.submitBtn}>
                    {loading ? 'Signing in…' : 'Sign In'}
                </button>
            </form>
        </div>
    );
}
