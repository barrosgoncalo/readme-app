import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, BookOpen, ArrowRight, LogOut } from 'lucide-react';
import { doSignOut } from '@readme/shared/src/services/auth';
import { WEB_ROUTES } from '../../constants/webRoutes.js';
import { ADMIN_ROUTES } from '../../constants/adminRoutes.js';
import styles from './AdminModeSelector.module.css'; // Optional: Or use the inline styled version below

export default function AdminModeSelector({ onSelect }) {
    const navigate = useNavigate();

    const handleSelection = (preference) => {
        onSelect(preference);
        if (preference === 'admin') {
            navigate(ADMIN_ROUTES.USERS);
        } else {
            navigate(WEB_ROUTES.BOOKS);
        }
    };

    return (
        <div style={containerStyle}>
            <div style={cardWrapperStyle}>
                <header style={headerStyle}>
                    <h1 style={titleStyle}>Choose Workspace</h1>
                    <p style={subtitleStyle}>Select how you want to experience ReadMe for this session.</p>
                </header>

                <div style={gridStyle}>
                    {/* Admin Portal Card */}
                    <button 
                        onClick={() => handleSelection('admin')} 
                        className={styles.card}
                    >
                        {/* Removed background, increased icon size to 40 */}
                        <div className={styles.iconContainer} style={{ color: 'var(--error)' }}>
                            <Shield size={40} />
                        </div>
                        <h2 className={styles.cardTitle}>Admin Portal</h2>
                        <p className={styles.cardDesc}>
                            Manage users, review flagged reports, analyze publication data, and configure site-wide preferences.
                        </p>
                        <div className={styles.actionLink}>
                            Enter Admin Mode <ArrowRight size={16} style={{ marginLeft: 6 }} />
                        </div>
                    </button>

                    {/* Book Community Card */}
                    <button 
                        onClick={() => handleSelection('user')} 
                        className={styles.card}
                    >
                        {/* Removed background, increased icon size to 40 */}
                        <div className={styles.iconContainer} style={{ color: 'var(--primary)' }}>
                            <BookOpen size={40} />
                        </div>
                        <h2 className={styles.cardTitle}>Book Community</h2>
                        <p className={styles.cardDesc}>
                            Explore catalogs, request swaps, browse the map, chat with other bookworms, and register for events.
                        </p>
                        <div className={styles.actionLink}>
                            Go to User App <ArrowRight size={16} style={{ marginLeft: 6 }} />
                        </div>
                    </button>
                </div>

                <footer style={footerStyle}>
                    <button onClick={doSignOut} style={logoutBtnStyle}>
                        <LogOut size={16} style={{ marginRight: 8 }} /> Sign Out
                    </button>
                </footer>
            </div>
        </div>
    );
}

// Minimal, reliable styling matching typical dark/light UI systems
const containerStyle = {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
    padding: '24px',
    boxSizing: 'border-box',
};

const cardWrapperStyle = {
    maxWidth: '800px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
};

const headerStyle = {
    textAlign: 'center',
};

const titleStyle = {
    fontSize: '2rem',
    fontWeight: '700',
    margin: '0 0 8px 0',
};

const subtitleStyle = {
    color: 'var(--text-muted)',
    fontSize: '1rem',
    margin: 0,
};

const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
};

const cardStyle = {
    background: 'var(--bg-elem)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '32px 24px',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    outline: 'none',
    fontFamily: 'inherit',
};

const iconContainerStyle = {
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const cardTitleStyle = {
    fontSize: '1.25rem',
    fontWeight: '600',
    margin: '0 0 12px 0',
    color: 'var(--text)',
};

const cardDescStyle = {
    fontSize: '0.925rem',
    lineHeight: '1.5',
    color: 'var(--text-muted)',
    margin: '0 0 24px 0',
    flexGrow: 1,
};

const actionLinkStyle = {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    marginTop: 'auto',
};

const footerStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '16px',
};

const logoutBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '8px 16px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
};
