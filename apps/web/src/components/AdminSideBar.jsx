import { NavLink } from 'react-router-dom';
import { ADMIN_ROUTES } from '../constants/adminRoutes'; 
import styles from './AdminSidebar.module.css';

// Only Reports has a real route right now. The rest are labeled
// but inert (no page built yet) — per instructions, not stubbing them.
const NAV_ITEMS = [
    { label: 'Dashboard', path: ADMIN_ROUTES.DASHBOARD, icon: <IconLucideLayoutDashboard size={18} />, enabled: false },
    { label: 'Users', path: ADMIN_ROUTES.USERS, icon: <IconLucideUsers size={18} />, enabled: false },
    { label: 'Reports', path: ADMIN_ROUTES.REPORTS, icon: <IconLucideFlag size={18} />, enabled: true },
    { label: 'Settings', path: ADMIN_ROUTES.SETTINGS, icon: <IconLucideSettings size={18} />, enabled: false },
    { label: 'Logs', path: ADMIN_ROUTES.LOGS, icon: <IconLucideFileText size={18} />, enabled: false },
];

const QUICK_ACTIONS = [
    { label: 'Search Users', icon: <IconLucideSearch size={16} /> },
    { label: 'Ban User', icon: <IconLucideBan size={16} /> },
    { label: 'View Banned Users', icon: <IconLucideUserX size={16} /> },
    { label: 'Report Reasons', icon: <IconLucideFlag size={16} /> },
];

export default function AdminSidebar() {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <IconLucideBookOpen size={22} />
                <span>SwapBooks Admin</span>
            </div>

            <nav className={styles.nav}>
                {NAV_ITEMS.map((item) =>
                    item.enabled ? (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
                            }
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ) : (
                        <div key={item.path} className={`${styles.navItem} ${styles.navItemDisabled}`}>
                            {item.icon}
                            <span>{item.label}</span>
                        </div>
                    )
                )}
            </nav>

            <div className={styles.quickActions}>
                <span className={styles.quickActionsTitle}>Quick actions</span>
                {QUICK_ACTIONS.map((action) => (
                    <button key={action.label} type="button" className={styles.quickActionBtn} disabled>
                        {action.icon}
                        <span>{action.label}</span>
                    </button>
                ))}
            </div>
        </aside>
    );
}
