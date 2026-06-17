import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';

export default function Profile() {
    const { currentUser } = useAuth();

    return (
        <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto', padding: 'var(--space-5) var(--space-4)' }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary)' }}>Profile</h1>
            <p style={{ color: 'var(--text)' }}>
                {currentUser?.displayName || currentUser?.email || 'Reader'}
            </p>
            <p style={{ color: 'var(--subtext)' }}>
                Editing your name, address, visibility, and favorite books will live here. Use "Sign
                out" in the sidebar to log out.
            </p>
        </div>
    );
}
