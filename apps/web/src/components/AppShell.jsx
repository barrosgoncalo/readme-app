import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { BookOpen, MessageCircle, Moon, Pin, PinOff, Search, Sun, User } from 'lucide-react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { doSignOut } from '@readme/shared/src/services/auth';
import { db } from '@readme/shared/src/services/firebase';
import { useTheme } from '../contexts/ThemeContext';
import { ToastProvider } from '../contexts/ToastContext';
import { WEB_ROUTES } from '../constants/webRoutes';
import { getContentWidthTier } from '../utils/contentWidth';
import styles from './AppShell.module.css';

const NAV_ITEMS = [
    { to: WEB_ROUTES.EXPLORE, label: 'Explore', Icon: Search },
    { to: WEB_ROUTES.BOOKS, label: 'Shelf', Icon: BookOpen },
    { to: WEB_ROUTES.CHAT, label: 'Chat', Icon: MessageCircle },
    { to: WEB_ROUTES.PROFILE, label: 'Profile', Icon: User },
];

const SIDEBAR_PIN_KEY = 'sidebarPinned';
const SIDEBAR_COLLAPSED_KEY = 'sidebarCollapsed';

function readStoredBool(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        if (value === null) return fallback;
        return value === 'true';
    } catch {
        return fallback;
    }
}

export default function AppShell() {
    const { currentUser } = useAuth();
    const { theme, toggle } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [username, setUsername] = useState('');

    const isExplorePage = location.pathname.startsWith(WEB_ROUTES.MAP);
    const isChatPage = location.pathname.startsWith(WEB_ROUTES.CHAT);
    const prefersRail = isExplorePage || isChatPage;

    const [isPinned, setIsPinned] = useState(() => readStoredBool(SIDEBAR_PIN_KEY, false));
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const stored = readStoredBool(SIDEBAR_COLLAPSED_KEY, prefersRail);
        return isPinned ? false : stored;
    });

    const isSidebarOpen = !isCollapsed;
    const widthTier = getContentWidthTier(location.pathname);

    useEffect(() => {
        if (isPinned) {
            setIsCollapsed(false);
            return;
        }
        if (prefersRail) {
            setIsCollapsed(true);
        }
    }, [prefersRail, isPinned, location.pathname]);

    useEffect(() => {
        try {
            localStorage.setItem(SIDEBAR_PIN_KEY, String(isPinned));
            localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
        } catch {
            /* ignore */
        }
    }, [isPinned, isCollapsed]);

    useEffect(() => {
        if (!currentUser?.uid) return;

        const unsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
            if (docSnap.exists()) {
                setUsername(docSnap.data().username || '');
            }
        });

        return () => unsubscribe();
    }, [currentUser]);

    async function onSignOut() {
        await doSignOut();
        navigate(WEB_ROUTES.LOGIN, { replace: true });
    }

    function toggleCollapse() {
        if (isPinned) return;
        setIsCollapsed(prev => !prev);
    }

    function togglePin() {
        setIsPinned(prev => {
            const next = !prev;
            if (next) setIsCollapsed(false);
            return next;
        });
    }

    function checkIsActive(to) {
        const searchParams = new URLSearchParams(location.search);
        const ownerParam = searchParams.get('owner');
        const isVisitingOtherUser = ownerParam && currentUser && ownerParam !== currentUser.uid;

        if (to === WEB_ROUTES.BOOKS)
            return location.pathname.startsWith(WEB_ROUTES.BOOKS) && !isVisitingOtherUser;

        if (to === WEB_ROUTES.MAP) {
            const isMap = location.pathname.startsWith(WEB_ROUTES.MAP);
            const isUsersProfile = location.pathname.startsWith('/users');
            const isOtherUserBook = location.pathname.startsWith(WEB_ROUTES.BOOKS) && isVisitingOtherUser;

            return isMap || isUsersProfile || isOtherUserBook;
        }

        return location.pathname.startsWith(to);
    }

    return (
        <ToastProvider>
            <div
                className={`${styles.shell} ${isCollapsed ? styles.shellCollapsed : ''} ${isChatPage ? styles.chatLock : ''}`}
            >
                <aside className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ''}`}>
                    <div className={styles.sidebarTop}>
                        <h1 className={styles.wordmark}>
                            <Link to={WEB_ROUTES.MAP} style={{ color: 'inherit', textDecoration: 'none' }}>
                                {isCollapsed ? 'R' : 'README'}
                            </Link>
                        </h1>
                        {!isCollapsed && (
                            <button
                                type="button"
                                className={styles.pinBtn}
                                onClick={togglePin}
                                title={isPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
                                aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
                            >
                                {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                            </button>
                        )}
                    </div>

                    <nav className={styles.nav}>
                        {NAV_ITEMS.map(({ to, label, Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                title={isCollapsed ? label : undefined}
                                className={() =>
                                    checkIsActive(to) ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                                }
                            >
                                <Icon size={18} aria-hidden />
                                {!isCollapsed && <span>{label}</span>}
                            </NavLink>
                        ))}
                    </nav>

                    <div className={styles.userFooter}>
                        {!isCollapsed && (
                            <span className={styles.userName}>
                                {username || currentUser?.email || 'Reader'}
                            </span>
                        )}
                        <div className={styles.footerActions}>
                            <button type="button" className={styles.iconBtn} onClick={toggle} title="Toggle theme">
                                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                            </button>
                            {!isCollapsed && (
                                <button type="button" className={styles.signOutBtn} onClick={onSignOut}>
                                    Sign out
                                </button>
                            )}
                        </div>
                    </div>

                    {!isPinned && (
                        <button
                            type="button"
                            className={styles.collapseToggle}
                            onClick={toggleCollapse}
                            title={isCollapsed ? 'Expand sidebar' : 'Collapse to icon rail'}
                            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse to icon rail'}
                        >
                            {isCollapsed ? '»' : '«'}
                        </button>
                    )}
                </aside>

                <main className={`${styles.content} ${isChatPage ? styles.chatContent : ''}`}>
                    <div className={`${styles.contentInner} ${styles[`width_${widthTier}`]}`}>
                        <Outlet context={{ isSidebarOpen, isCollapsed }} />
                    </div>
                </main>
            </div>
            <div id="modal-root" />
        </ToastProvider>
    );
}
