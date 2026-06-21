// Web equivalent of apps/mobile/src/navigation/AppNavigator.js.
//   loading      → spinner
//   logged in    → /books (RequireAuth-guarded, behind AppShell)
//   logged out   → first launch shows /welcome, returning users go to /login
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';

import Splash from '../pages/Splash.jsx';
import Welcome from '../pages/Welcome.jsx';
import Login from '../pages/Login.jsx';
import ForgotPassword from '../pages/ForgotPassword.jsx';
import Register from '../pages/Register/index.jsx';
import Books from '../pages/Books/index.jsx';
import BooksScan from '../pages/Books/Scan.jsx';
import Trades from '../pages/Trades/index.jsx';
import Events from '../pages/Events/index.jsx';
import MapPage from '../pages/Map/index.jsx';
import EventDetails from '../pages/Events/Details.jsx';
import Chat from '../pages/Chat/index.jsx';
import Profile from '../pages/Profile/index.jsx';
import EditProfile from '../pages/Profile/EditProfile.jsx';
import ChangePassword from '../pages/Profile/ChangePassword.jsx';
import PrivacySecurity from '../pages/Profile/PrivacySecurity.jsx';
import BlockedUsers from '../pages/Profile/BlockedUsers.jsx';
import Friends from '../pages/Profile/Friends.jsx';
import PublicProfile from '../pages/Users/PublicProfile.jsx';
import BookDetail from '../pages/Books/BookDetail.jsx';
import AppShell from '../components/AppShell.jsx';
import RequireAuth from '../auth/RequireAuth.jsx';
import { WEB_ROUTES } from '../constants/webRoutes.js';

const ALREADY_LAUNCHED_KEY = 'alreadyLaunched';

export default function AppRouter() {
    const { userLoggedIn, loading } = useAuth();
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

    if (loading || isFirstLaunch === null) {
        return <Splash />;
    }

    // Logged-out users coming to "/" land on Welcome (first launch) or Login.
    const loggedOutHome = isFirstLaunch ? WEB_ROUTES.WELCOME : WEB_ROUTES.LOGIN;

    return (
        <Routes>
            <Route
                path="/"
                element={
                    userLoggedIn ? (
                        <Navigate to={WEB_ROUTES.BOOKS} replace />
                    ) : (
                        <Navigate to={loggedOutHome} replace />
                    )
                }
            />
            <Route path={WEB_ROUTES.WELCOME} element={<Welcome />} />
            <Route path={WEB_ROUTES.LOGIN} element={<Login />} />
            <Route path={WEB_ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
            <Route path={`${WEB_ROUTES.REGISTER}/*`} element={<Register />} />
            <Route
                element={
                    <RequireAuth>
                        <AppShell />
                    </RequireAuth>
                }
            >
                <Route path={WEB_ROUTES.BOOKS} element={<Books />} />
                <Route path={WEB_ROUTES.BOOKS_SCAN} element={<BooksScan />} />
                <Route path="/books/:bookId" element={<BookDetail />} />
                <Route path={WEB_ROUTES.TRADES} element={<Trades />} />
                <Route path={WEB_ROUTES.EVENTS} element={<Events />} />
                <Route path={WEB_ROUTES.MAP} element={<MapPage />} />
                <Route path="/events/:eventId" element={<EventDetails />} />
                <Route path={WEB_ROUTES.CHAT} element={<Chat />} />
                <Route path={WEB_ROUTES.PROFILE} element={<Profile />} />
                <Route path={WEB_ROUTES.PROFILE_EDIT} element={<EditProfile />} />
                <Route path={WEB_ROUTES.PROFILE_CHANGE_PASSWORD} element={<ChangePassword />} />
                <Route path={WEB_ROUTES.PROFILE_PRIVACY_SECURITY} element={<PrivacySecurity />} />
                <Route path={WEB_ROUTES.PROFILE_BLOCKED_USERS} element={<BlockedUsers />} />
                <Route path={WEB_ROUTES.PROFILE_FRIENDS} element={<Friends />} />
                <Route path="/users/:uid" element={<PublicProfile />} />
            </Route>
            <Route
                path="*"
                element={
                    <Navigate
                        to={userLoggedIn ? WEB_ROUTES.BOOKS : WEB_ROUTES.LOGIN}
                        state={{ from: location }}
                        replace
                    />
                }
            />
        </Routes>
    );
}
