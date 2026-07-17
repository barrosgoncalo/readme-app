// apps/web/src/navigation/AppRouter.jsx
//
// Merged router for both branches. Auth + first-launch logic comes from the
// user-app router; role resolution comes from the admin-app router (now via
// the shared useUserRole hook). The bifurcation happens AFTER login: both
// admins and normal users hit the same /login screen, and once Firebase
// auth + role resolve, they're routed into either the admin tree or the
// user tree.
import { WEB_ROUTES } from '../constants/webRoutes.js';
import { ADMIN_ROUTES } from '../constants/adminRoutes.js';
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { useUserRole } from '@readme/shared/src/hooks/use-user-role';

// --- shared / entry pages ---
import Splash from '../pages/Splash.jsx';
import Welcome from '../pages/Welcome.jsx';
import Login from '../pages/Login.jsx';
import ForgotPassword from '../pages/ForgotPassword.jsx';
import Register from '../pages/Register/index.jsx';

// --- user-app pages ---
import BooksLayout from '../pages/Books/BooksLayout.jsx';
import BooksScan from '../pages/Books/Scan.jsx';
import Events from '../pages/Events/index.jsx';
import MapPage from '../pages/Map/index.jsx';
import Chat from '../pages/Chat/index.jsx';
import ProfileLayout from '../pages/Profile/ProfileLayout.jsx';
import EditProfile from '../pages/Profile/EditProfile.jsx';
import ChangePassword from '../pages/Profile/ChangePassword.jsx';
import PrivacySecurity from '../pages/Profile/PrivacySecurity.jsx';
import BlockedUsers from '../pages/Profile/BlockedUsers.jsx';
import Following from '../pages/Profile/Following.jsx';
import Followers from '../pages/Profile/Followers.jsx';
import Favorites from '../pages/Profile/Favorites.jsx';
import MyBooks from '../pages/Profile/MyBooks.jsx';
import Level from '../pages/Profile/Level.jsx';
import PublicProfile from '../pages/Users/PublicProfile.jsx';
import { PublicationDetailRoute, EventDetailRoute } from '../pages/DetailRoutes.jsx';
import CreatePublication from '../pages/Publications/CreatePublication.jsx';
import NewOffer from '../pages/Offers/NewOffer.jsx';
import AppShell from '../components/AppShell.jsx';

// --- admin-app pages (moved under pages/Admin, same subtree as main branch) ---
// NB: renamed on import to avoid clashing with the user-app "Publications" page.
import AdminUsersPage from '../pages/Admin/Users/UsersPage.jsx';
import AdminDashboard from '../pages/Admin/Dashboard/Dashboard.jsx';
import AdminReportsPage from '../pages/Admin/Reports/ReportsPage.jsx';
import AdminPublicationsPage from '../pages/Admin/Publications/Publications.jsx';
import AdminSettingsPage from '../pages/Admin/Settings/SettingsPage.jsx';
import AdminShell from '../components/AdminShell.jsx';

const ALREADY_LAUNCHED_KEY = 'alreadyLaunched';

export default function AppRouter() {
    const { userLoggedIn, loading } = useAuth();
    const { role, resolvingRole } = useUserRole();
    const [isFirstLaunch, setIsFirstLaunch] = useState(null);
    const location = useLocation();

    useEffect(() => {
        try {
            const value = localStorage.getItem(ALREADY_LAUNCHED_KEY);
            setIsFirstLaunch(value === null);
            if (value === null) {
                localStorage.setItem(ALREADY_LAUNCHED_KEY, 'true');
            }
        } catch {
            setIsFirstLaunch(false);
        }
    }, []);

    // Wait for: auth to settle, first-launch flag to resolve, and (if logged
    // in) the role lookup to finish before we know which tree to render.
    if (loading || isFirstLaunch === null || (userLoggedIn && resolvingRole)) {
        return <Splash />;
    }

    const isAdmin = userLoggedIn && role === 'admin';
    const loggedOutHome = isFirstLaunch ? WEB_ROUTES.WELCOME : WEB_ROUTES.LOGIN;
    const loggedInHome = isAdmin ? ADMIN_ROUTES.USERS : WEB_ROUTES.BOOKS;

    return (
        <Routes>
            <Route
                path="/"
                element={
                    userLoggedIn ? (
                        <Navigate to={loggedInHome} replace />
                    ) : (
                        <Navigate to={loggedOutHome} replace />
                    )
                }
            />

            {/* Shared, pre-auth routes. Same login screen for everyone —
                the split happens after auth + role resolve above. */}
            <Route path={WEB_ROUTES.WELCOME} element={<Welcome />} />
            <Route path={WEB_ROUTES.LOGIN} element={<Login />} />
            <Route path={WEB_ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
            <Route path={`${WEB_ROUTES.REGISTER}/*`} element={<Register />} />

            {/* Protected routes only render at all when logged in. A logged-out
                visitor hitting one of these paths directly won't match anything
                here and falls through to the catch-all below, which sends them
                to /login (with `from` in state so you can bounce them back). */}
            {userLoggedIn && isAdmin && (
                <Route element={<AdminShell />}>
                    <Route path={ADMIN_ROUTES.USERS} element={<AdminUsersPage />} />
                    <Route path={ADMIN_ROUTES.PUBLICATIONS} element={<AdminPublicationsPage />} />
                    <Route path={ADMIN_ROUTES.REPORTS} element={<AdminReportsPage />} />
                    <Route path={ADMIN_ROUTES.DASHBOARD} element={<AdminDashboard />} />
                    <Route path={ADMIN_ROUTES.SETTINGS} element={<AdminSettingsPage />} />
                </Route>
            )}

            {userLoggedIn && !isAdmin && (
                <Route element={<AppShell />}>
                    <Route path={WEB_ROUTES.BOOKS} element={<BooksLayout />} />
                    <Route path="/books/:bookId" element={<BooksLayout />} />
                    <Route path={WEB_ROUTES.BOOKS_SCAN} element={<BooksScan />} />
                    <Route path={WEB_ROUTES.EVENTS} element={<Events />} />
                    <Route path={WEB_ROUTES.MAP} element={<MapPage />} />
                    <Route path="/events/:eventId" element={<EventDetailRoute />} />
                    <Route path={WEB_ROUTES.CHAT} element={<Chat />} />
                    <Route path={WEB_ROUTES.PROFILE} element={<ProfileLayout />}>
                        <Route path="following" element={<Following />} />
                        <Route path="followers" element={<Followers />} />
                        <Route path="favorites" element={<Favorites />} />
                        <Route path="my-books" element={<MyBooks />} />
                        <Route path="level" element={<Level />} />
                        <Route path="blocked-users" element={<BlockedUsers />} />
                    </Route>
                    <Route path={WEB_ROUTES.PROFILE_EDIT} element={<EditProfile />} />
                    <Route path={WEB_ROUTES.PROFILE_CHANGE_PASSWORD} element={<ChangePassword />} />
                    <Route path={WEB_ROUTES.PROFILE_PRIVACY_SECURITY} element={<PrivacySecurity />} />
                    <Route path={WEB_ROUTES.PUBLICATION_NEW} element={<CreatePublication />} />
                    <Route path="/publications/:pubId" element={<PublicationDetailRoute />} />
                    <Route path={WEB_ROUTES.OFFERS_NEW} element={<NewOffer />} />
                    <Route path="/users/:uid" element={<PublicProfile />} />
                </Route>
            )}

            <Route
                path="*"
                element={
                    <Navigate
                        to={userLoggedIn ? loggedInHome : WEB_ROUTES.LOGIN}
                        state={{ from: location }}
                        replace
                    />
                }
            />
        </Routes>
    );
}
