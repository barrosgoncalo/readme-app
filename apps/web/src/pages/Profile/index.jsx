import { useState, useEffect } from 'react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import Field from '../../components/Field';
import Button from '../../components/Button';
import styles from './Profile.module.css';

export default function Profile() {
    const { currentUser } = useAuth();

    // Estado para as abas
    const [activeSection, setActiveSection] = useState('update');

    // Estado para o tema
    const [themePreference, setThemePreference] = useState(() => {
        return localStorage.getItem('app-theme') || 'system';
    });

    // Efeito para aplicar o tema no HTML
    useEffect(() => {
        const root = document.documentElement;
        if (themePreference === 'dark') {
            root.setAttribute('data-theme', 'dark');
        } else if (themePreference === 'light') {
            root.setAttribute('data-theme', 'light');
        } else {
            root.removeAttribute('data-theme');
        }
        localStorage.setItem('app-theme', themePreference);
    }, [themePreference]);

    return (
        <div className={styles.pageContainer}>
            {/* CABEÇALHO */}
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
                {/* MENU LATERAL */}
                <aside className={styles.menu}>
                    <button
                        className={`${styles.menuItem} ${activeSection === 'update' ? styles.active : ''}`}
                        onClick={() => setActiveSection('update')}
                    >
                        <span>👤</span> Alterar Dados
                    </button>
                    <button
                        className={`${styles.menuItem} ${activeSection === 'stats' ? styles.active : ''}`}
                        onClick={() => setActiveSection('stats')}
                    >
                        <span>📊</span> Estatísticas
                    </button>
                    <button
                        className={`${styles.menuItem} ${activeSection === 'exchanges' ? styles.active : ''}`}
                        onClick={() => setActiveSection('exchanges')}
                    >
                        <span>🤝</span> Trocas Efetuadas
                    </button>
                    <button
                        className={`${styles.menuItem} ${activeSection === 'settings' ? styles.active : ''}`}
                        onClick={() => setActiveSection('settings')}
                    >
                        <span>⚙️</span> Definições
                    </button>
                </aside>

                {/* ÁREA DE CONTEÚDO */}
                <main className={styles.contentArea}>

                    {activeSection === 'update' && (
                        <div className={styles.sectionCard}>
                            <h2 className={styles.sectionTitle}>Alterar Dados Pessoais</h2>
                            <p className={styles.sectionSubtitle}>Atualiza a tua informação para a comunidade.</p>
                            <form className={styles.form}>
                                <Field label="Nome Completo" name="displayName" defaultValue={currentUser?.displayName || ''} />
                                <Field label="Morada ou Localidade" name="address" defaultValue={currentUser?.address || ''} />
                                <Field label="Telefone" name="phone" type="tel" defaultValue={currentUser?.phone || ''} />
                                <div className={styles.actions}>
                                    <Button type="submit">Guardar Alterações</Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeSection === 'stats' && (
                        <div className={styles.sectionCard}>
                            <h2 className={styles.sectionTitle}>Estatísticas</h2>
                            <div className={styles.statsGrid}>
                                <div className={styles.statBox}>
                                    <span className={styles.statValue}>12</span>
                                    <span className={styles.statLabel}>Livros Lidos</span>
                                </div>
                                <div className={styles.statBox}>
                                    <span className={styles.statValue}>5</span>
                                    <span className={styles.statLabel}>Trocas Feitas</span>
                                </div>
                                <div className={styles.statBox}>
                                    <span className={styles.statValue}>3</span>
                                    <span className={styles.statLabel}>Eventos Criados</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'exchanges' && (
                        <div className={styles.sectionCard}>
                            <h2 className={styles.sectionTitle}>Trocas Efetuadas</h2>
                            <div className={styles.emptyState}>
                                <p>Ainda não efetuaste nenhuma troca de livros.</p>
                            </div>
                        </div>
                    )}

                    {activeSection === 'settings' && (
                        <div className={styles.sectionCard}>
                            <h2 className={styles.sectionTitle}>Definições</h2>

                            {/* --- SECÇÃO DO TEMA (Onde a função setThemePreference é usada!) --- */}
                            <div className={styles.settingsGroup}>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>Aparência</h3>
                                <p className={styles.helpText} style={{ marginLeft: 0, marginBottom: '1rem' }}>
                                    Escolhe o tema da aplicação.
                                </p>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <Button
                                        variant={themePreference === 'light' ? 'primary' : 'secondary'}
                                        onClick={() => setThemePreference('light')}
                                    >
                                        ☀️ Claro
                                    </Button>
                                    <Button
                                        variant={themePreference === 'dark' ? 'primary' : 'secondary'}
                                        onClick={() => setThemePreference('dark')}
                                    >
                                        🌙 Escuro
                                    </Button>
                                    <Button
                                        variant={themePreference === 'system' ? 'primary' : 'secondary'}
                                        onClick={() => setThemePreference('system')}
                                    >
                                        💻 Sistema
                                    </Button>
                                </div>
                            </div>

                            {/* --- SECÇÃO DE VISIBILIDADE --- */}
                            <div className={styles.settingsGroup}>
                                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text)' }}>Visibilidade</h3>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" defaultChecked={true} />
                                    Tornar o meu perfil público
                                </label>
                                <p className={styles.helpText}>
                                    Se estiver ativo, outros utilizadores poderão ver o teu perfil e propor trocas de livros.
                                </p>
                            </div>

                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}