import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Sun, Moon, BookOpen, ArrowLeftRight, CalendarDays, Map, User } from 'lucide-react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { doSignOut } from '@readme/shared/src/services/auth.web';
import { useTheme } from '../contexts/ThemeContext';
import { WEB_ROUTES } from '../constants/webRoutes';
import styles from './AppShell.module.css';

const NAV_ITEMS = [
    { to: WEB_ROUTES.BOOKS, label: 'My Books', Icon: BookOpen },
    { to: WEB_ROUTES.TRADES, label: 'Trades', Icon: ArrowLeftRight },
    { to: WEB_ROUTES.EVENTS, label: 'Events', Icon: CalendarDays },
    { to: WEB_ROUTES.MAP, label: 'Explore', Icon: Map },
    { to: WEB_ROUTES.PROFILE, label: 'Profile', Icon: User },
];

export default function AppShell() {
    const { currentUser } = useAuth();
    const { theme, toggle } = useTheme();
    const navigate = useNavigate();

    async function onSignOut() {
        await doSignOut();
        navigate(WEB_ROUTES.LOGIN, { replace: true });
    }

    return (
        <div className={styles.shell}>
            <aside className={styles.sidebar}>
                <h1 className={styles.wordmark}>README</h1>
                <nav className={styles.nav}>
                    {NAV_ITEMS.map(({ to, label, Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                            }
                        >
                            <Icon size={18} aria-hidden />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className={styles.userFooter}>
                    <span className={styles.userName}>
                        {currentUser?.displayName || currentUser?.email || 'Reader'}
                    </span>
                    <div className={styles.footerActions}>
                        <button type="button" className={styles.iconBtn} onClick={toggle} title="Toggle theme">
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
                        <button type="button" className={styles.signOutBtn} onClick={onSignOut}>
                            Sign out
                        </button>
                    </div>
                </div>
            </aside>
            <main className={styles.content}>
                <Outlet />
            </main>
        </div>
    );
}
