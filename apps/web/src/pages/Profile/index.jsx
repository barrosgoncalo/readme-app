import { useState } from 'react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import Field from '../../components/Field';
import Button from '../../components/Button';
import styles from './Profile.module.css';

export default function Profile() {
    const { currentUser } = useAuth();

    // O estado que controla qual é a aba/secção aberta de momento.
    // Começa na secção 'update' por defeito.
    const [activeSection, setActiveSection] = useState('update');

    return (
        <div className={styles.pageContainer}>
            {/* Cabeçalho Fixo do Perfil */}
            <div className={styles.headerArea}>
                <div className={styles.avatar}>
                    {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'R'}
                </div>
                <div>
                    <h1 className={styles.pageTitle}>{currentUser?.displayName || 'Reader'}</h1>
                    <p className={styles.userEmail}>{currentUser?.email}</p>
                </div>
            </div>

            <div className={styles.layout}>
                {/* --- MENU DE OPÇÕES (TÍTULOS) --- */}
                <aside className={styles.menu}>
                    <button
                        className={`${styles.menuItem} ${activeSection === 'update' ? styles.active : ''}`}
                        onClick={() => setActiveSection('update')}
                    >
                        <span>👤</span> Update Profile
                    </button>
                    <button
                        className={`${styles.menuItem} ${activeSection === 'stats' ? styles.active : ''}`}
                        onClick={() => setActiveSection('stats')}
                    >
                        <span>📊</span> Stats
                    </button>
                    <button
                        className={`${styles.menuItem} ${activeSection === 'exchanges' ? styles.active : ''}`}
                        onClick={() => setActiveSection('exchanges')}
                    >
                        <span>🤝</span> Swaps Completed
                    </button>
                    <button
                        className={`${styles.menuItem} ${activeSection === 'settings' ? styles.active : ''}`}
                        onClick={() => setActiveSection('settings')}
                    >
                        <span>⚙️</span> Privacy
                    </button>
                </aside>

                {/* --- ÁREA DE CONTEÚDO (Muda conforme a seleção) --- */}
                <main className={styles.contentArea}>

                    {/* Só mostra este bloco se o activeSection for 'update' */}
                    {activeSection === 'update' && (
                        <div className={styles.sectionCard}>
                            <h2 className={styles.sectionTitle}>Update Profile Data</h2>

                            <form className={styles.form}>
                                <Field
                                    label="Name"
                                    name="displayName"
                                    defaultValue={currentUser?.displayName || ''}
                                />
                                <Field
                                    label="Address"
                                    name="address"
                                    defaultValue={currentUser?.address || ''}
                                />
                                <Field
                                    label="Phone Number"
                                    name="phone"
                                    type="tel"
                                    defaultValue={currentUser?.phone || ''}
                                />
                                <div className={styles.actions}>
                                    <Button type="submit">Save Changes</Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Só mostra este bloco se o activeSection for 'stats' */}
                    {activeSection === 'stats' && (
                        <div className={styles.sectionCard}>
                            <h2 className={styles.sectionTitle}>Stats</h2>
                            <div className={styles.statsGrid}>
                                <div className={styles.statBox}>
                                    <span className={styles.statValue}>5</span> {/*Alterar para o número real que provirá da DB*/}
                                    <span className={styles.statLabel}>Completed Swaps</span>
                                </div>
                                <div className={styles.statBox}>
                                    <span className={styles.statValue}>3</span> {/*Alterar para o número real que provirá da DB*/}
                                    <span className={styles.statLabel}>Events Participated</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Só mostra este bloco se o activeSection for 'exchanges' */}
                    {activeSection === 'exchanges' && (
                        <div className={styles.sectionCard}>
                            <h2 className={styles.sectionTitle}>Swaps Completed</h2>
                            <div className={styles.emptyState}>
                                <p>You've not completed a swap yet.</p> {/*Alterar para o número real que provirá da DB*/}
                            </div>
                        </div>
                    )}

                    {/* Só mostra este bloco se o activeSection for 'settings' */}
                    {activeSection === 'settings' && (
                        <div className={styles.sectionCard}>
                            <h2 className={styles.sectionTitle}>Privacy and Settings</h2>
                            <div className={styles.settingsGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" defaultChecked={true} />
                                    Make my profile public
                                </label>
                                <p className={styles.helpText}>
                                    If active, others users may see your profile and propose swaps.
                                </p>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}