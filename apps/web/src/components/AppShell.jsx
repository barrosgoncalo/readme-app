import {useEffect, useState} from 'react';
import {Link, NavLink, Outlet, useNavigate, useLocation} from 'react-router-dom';
import {doc, onSnapshot} from 'firebase/firestore';
import {BookOpen, CalendarDays, Map, MessageCircle, Moon, Sun, User} from 'lucide-react';
import {useAuth} from '@readme/shared/src/contexts/AuthContext/web';
import {doSignOut} from '@readme/shared/src/services/auth';
import {db} from '@readme/shared/src/services/firebase';
import {useTheme} from '../contexts/ThemeContext';
import {WEB_ROUTES} from '../constants/webRoutes';
import styles from './AppShell.module.css';

const NAV_ITEMS = [
    {to: WEB_ROUTES.BOOKS, label: 'My Books', Icon: BookOpen},
    {to: WEB_ROUTES.EVENTS, label: 'Events', Icon: CalendarDays},
    {to: WEB_ROUTES.MAP, label: 'Explore', Icon: Map},
    {to: WEB_ROUTES.CHAT, label: 'Chat', Icon: MessageCircle},
    {to: WEB_ROUTES.PROFILE, label: 'Profile', Icon: User},
];

export default function AppShell() {
    const {currentUser} = useAuth();
    const {theme, toggle} = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [username, setUsername] = useState('');

    const isExplorePage = location.pathname.startsWith(WEB_ROUTES.MAP);
    const isChatPage = location.pathname.startsWith(WEB_ROUTES.CHAT);
    const shouldCollapseSidebar = isExplorePage || isChatPage;
    const [isSidebarOpen, setIsSidebarOpen] = useState(!shouldCollapseSidebar);

    useEffect(() => {
        if (shouldCollapseSidebar) {
            setIsSidebarOpen(false);
        } else {
            setIsSidebarOpen(true);
        }
    }, [shouldCollapseSidebar]);

    const handleLogoClick = (e) => {
        if (shouldCollapseSidebar) {
            e.preventDefault();
            setIsSidebarOpen(!isSidebarOpen);
        }
    };

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
        navigate(WEB_ROUTES.LOGIN, {replace: true});
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
        <div className={`${styles.shell} ${!isSidebarOpen ? styles.shellCollapsed : ''} ${isChatPage ? styles.chatLock : ''}`}>
            <aside className={`${styles.sidebar} ${!isSidebarOpen ? styles.sidebarCollapsed : ''}`}>
                <h1 className={styles.wordmark}>
                    <Link to={WEB_ROUTES.MAP} onClick={handleLogoClick} style={{color: 'inherit', textDecoration: 'none'}}>
                        README
                    </Link>
                </h1>

                {isSidebarOpen && (
                    <>
                        <nav className={styles.nav}>
                            {NAV_ITEMS.map(({to, label, Icon}) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    className={() =>
                                        checkIsActive(to) ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                                    }
                                >
                                    <Icon size={18} aria-hidden/>
                                    <span>{label}</span>
                                </NavLink>
                            ))}
                        </nav>
                        <div className={styles.userFooter}>
                            <span className={styles.userName}>
                                {username || currentUser?.email || 'Reader'}
                            </span>
                            <div className={styles.footerActions}>
                                <button type="button" className={styles.iconBtn} onClick={toggle} title="Toggle theme">
                                    {theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}
                                </button>
                                <button type="button" className={styles.signOutBtn} onClick={onSignOut}>
                                    Sign out
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </aside>
            <main className={`${styles.content} ${isChatPage ? styles.chatContent : ''}`}>
                <Outlet context={{ isSidebarOpen }} />
            </main>
        </div>
    );
}