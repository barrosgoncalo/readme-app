import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, BookOpen, ArrowRight, LogOut } from 'lucide-react';
import { doSignOut } from '@readme/shared/src/services/auth';
import { WEB_ROUTES } from '../../../constants/webRoutes.js';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import styles from './AdminModeSelector.module.css';

export default function AdminModeSelector({ onSelect }) {
    const navigate = useNavigate();

    const handleSelection = (preference) => {
        onSelect(preference);
        if (preference === 'admin') {
            navigate(ADMIN_ROUTES.DASHBOARD);
        } else {
            navigate(WEB_ROUTES.EXPLORE);
        }
    };

    const handleSignOut = () => {
        sessionStorage.removeItem('admin_preference'); // Safety wipe on click
        doSignOut();
    };

    return (
        <div className={styles.container}>
            <div className={styles.cardWrapper}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Choose Workspace</h1>
                    <p className={styles.subtitle}>Select how you want to experience ReadMe for this session.</p>
                </header>

                <div className={styles.grid}>
                    {/* Admin Portal Card */}
                    <button 
                        onClick={() => handleSelection('admin')} 
                        className={styles.card}
                    >
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

                <footer className={styles.footer}>
                    <button onClick={handleSignOut} className={styles.logoutBtn}>
                        <LogOut size={16} style={{ marginRight: 8 }} /> Sign Out
                    </button>
                </footer>
            </div>
        </div>
    );
}
