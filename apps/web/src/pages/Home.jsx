import { useNavigate } from 'react-router-dom';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { doSignOut } from '@readme/shared/src/services/auth.web';
import Button from '../components/Button.jsx';

export default function Home() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    async function onSignOut() {
        await doSignOut();
        navigate('/login', { replace: true });
    }

    return (
        <main
            style={{
                maxWidth: 'var(--max-content-width)',
                margin: '0 auto',
                padding: 'var(--space-5) var(--space-4)',
            }}
        >
            <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary)' }}>
                Hello, {currentUser?.displayName || currentUser?.email || 'reader'}
            </h1>
            <p style={{ color: 'var(--subtext)' }}>
                The authenticated area is still under construction. Profile, events, books, and chat will live here.
            </p>
            <div style={{ marginTop: 'var(--space-4)', maxWidth: 200 }}>
                <Button variant="ghost" onClick={onSignOut}>
                    Sign out
                </Button>
            </div>
        </main>
    );
}
