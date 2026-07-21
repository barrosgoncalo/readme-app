import {NavLink} from 'react-router-dom';
import {LayoutDashboard, Users, Library, Flag, Settings, FileText, Search, Ban, UserX, BookOpen} from 'lucide-react'
import {ADMIN_ROUTES} from '../constants/adminRoutes';
import {useQuickActions} from '../contexts/QuickActionsContext.jsx';
import styles from './AdminSidebar.module.css';

const NAV_ITEMS = [
    {label: 'Dashboard', path: ADMIN_ROUTES.DASHBOARD, icon: <LayoutDashboard size={18}/>, enabled: true},
    {label: 'Users', path: ADMIN_ROUTES.USERS, icon: <Users size={18}/>, enabled: true},
    {label: 'Publications', path: ADMIN_ROUTES.PUBLICATIONS, icon: <Library size={18}/>, enabled: true},
    {label: 'Reports', path: ADMIN_ROUTES.REPORTS, icon: <Flag size={18}/>, enabled: true},
    {label: 'Settings', path: ADMIN_ROUTES.SETTINGS, icon: <Settings size={18}/>, enabled: true},
    {label: 'Logs', path: ADMIN_ROUTES.LOGS, icon: <FileText size={18}/>, enabled: false},
];

const QUICK_ACTIONS = [
    {label: 'Search Users', icon: <Search size={16}/>, action: 'searchUsers'},
    {label: 'Ban User', icon: <Ban size={16}/>, action: 'banUser'},
    {label: 'View Banned Users', icon: <UserX size={16}/>, action: 'bannedUsers'},
    {label: 'Report Reasons', icon: <Flag size={16}/>, action: 'reportReasons'},
];

export default function AdminSidebar() {
    const {openAction} = useQuickActions();

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <BookOpen size={22}/>
                <span>SwapBooks Admin</span>
            </div>

            <nav className={styles.nav}>
                {NAV_ITEMS.map((item) =>
                    item.enabled ? (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({isActive}) =>
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
                {QUICK_ACTIONS.map((qa) => (
                    <button
                        key={qa.action}
                        type="button"
                        className={styles.quickActionBtn}
                        onClick={() => openAction(qa.action)}
                    >
                        {qa.icon}
                        <span>{qa.label}</span>
                    </button>
                ))}
            </div>
        </aside>
    );
}
