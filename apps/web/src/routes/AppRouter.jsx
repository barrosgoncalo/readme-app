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

// --- admin selector screen ---
import AdminModeSelector from '../pages/Admin/AdminModeSelector/AdminModeSelector.jsx';

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

// --- admin-app pages ---
import AdminUsersPage from '../pages/Admin/Users/UsersPage.jsx';
import AdminDashboard from '../pages/Admin/Dashboard/Dashboard.jsx';
import AdminReportsPage from '../pages/Admin/Reports/ReportsPage.jsx';
import AdminPublicationsPage from '../pages/Admin/Publications/Publications.jsx';
import AdminSettingsPage from '../pages/Admin/Settings/SettingsPage.jsx';
import AdminShell from '../components/AdminShell.jsx';

const ALREADY_LAUNCHED_KEY = 'alreadyLaunched';
const ADMIN_PREFERENCE_KEY = 'admin_preference';

export default function AppRouter() {
    const { userLoggedIn, loading } = useAuth();
    const { role, resolvingRole } = useUserRole();
    const [isFirstLaunch, setIsFirstLaunch] = useState(null);
    const [adminPreference, setAdminPreference] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const launched = localStorage.getItem(ALREADY_LAUNCHED_KEY);
        if (launched) {
            setIsFirstLaunch(false);
        } else {
            setIsFirstLaunch(true);
        }
    }, []);

    useEffect(() => {
        if (userLoggedIn && role === 'admin') {
            const savedPref = sessionStorage.getItem(ADMIN_PREFERENCE_KEY); 
            setAdminPreference(savedPref); 
        } else {
            sessionStorage.removeItem(ADMIN_PREFERENCE_KEY);
            setAdminPreference(null);
        }
    }, [userLoggedIn, role]);

    if (loading || isFirstLaunch === null || (userLoggedIn && resolvingRole)) {
        return <Splash />;
    }

    const roleIsAdmin = userLoggedIn && role === 'admin';

    // Determine the target fallback route upon login/redirect
    let loggedInHome = WEB_ROUTES.BOOKS;
    if (roleIsAdmin) {
        if (adminPreference === 'admin') {
            loggedInHome = ADMIN_ROUTES.USERS;
        } else if (adminPreference === 'user') {
            loggedInHome = WEB_ROUTES.BOOKS;
        } else {
            loggedInHome = '/admin-choice';
        }
    }

    const loggedOutHome = isFirstLaunch ? WEB_ROUTES.WELCOME : WEB_ROUTES.LOGIN;

    // Render configuration flags
    const showAdminApp = roleIsAdmin && adminPreference === 'admin';
    const showUserApp = !roleIsAdmin || adminPreference === 'user';

    const handleSetAdminPreference = (preference) => {
        sessionStorage.setItem(ADMIN_PREFERENCE_KEY, preference);
        setAdminPreference(preference);
    };

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

            {/* Shared, pre-auth routes */}
            <Route path={WEB_ROUTES.WELCOME} element={<Welcome />} />
            <Route path={WEB_ROUTES.LOGIN} element={<Login />} />
            <Route path={WEB_ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
            <Route path={`${WEB_ROUTES.REGISTER}/*`} element={<Register />} />

            {/* Admin choice portal (guarded) */}
            {roleIsAdmin && (
                <Route 
                    path="/admin-choice" 
                    element={
                        <AdminModeSelector onSelect={handleSetAdminPreference} />
                    } 
                />
            )}

            {/* Admin Mode Routes */}
            {userLoggedIn && showAdminApp && (
                <Route element={<AdminShell />}>
                    <Route path={ADMIN_ROUTES.USERS} element={<AdminUsersPage />} />
                    <Route path={ADMIN_ROUTES.PUBLICATIONS} element={<AdminPublicationsPage />} />
                    <Route path={ADMIN_ROUTES.REPORTS} element={<AdminReportsPage />} />
                    <Route path={ADMIN_ROUTES.DASHBOARD} element={<AdminDashboard />} />
                    <Route path={ADMIN_ROUTES.SETTINGS} element={<AdminSettingsPage />} />
                </Route>
            )}

            {/* Normal User App Routes (also viewable by Admins on user mode) */}
            {userLoggedIn && showUserApp && (
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
