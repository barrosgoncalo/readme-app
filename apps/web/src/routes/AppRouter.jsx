// Web equivalent of apps/mobile/src/navigation/AppNavigator.js.
//   loading      → spinner
//   logged in    → /books (RequireAuth-guarded, behind AppShell)
//   logged out   → first launch shows /welcome, returning users go to /login
import { WEB_ROUTES } from '../constants/webRoutes.js';
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';

import Splash from '../pages/Splash.jsx';
import Welcome from '../pages/Welcome.jsx';
import Login from '../pages/Login.jsx';
import ForgotPassword from '../pages/ForgotPassword.jsx';
import Register from '../pages/Register/index.jsx';
import BooksLayout from '../pages/Books/BooksLayout.jsx';
import BooksScan from '../pages/Books/Scan.jsx';
import Events from '../pages/Events/index.jsx';
import MapPage from '../pages/Map/index.jsx';
import EventDetails from '../pages/Events/Details.jsx';
import Chat from '../pages/Chat/index.jsx';
import ProfileLayout from '../pages/Profile/ProfileLayout.jsx';
import EditProfile from '../pages/Profile/EditProfile.jsx';
import ChangePassword from '../pages/Profile/ChangePassword.jsx';
import PrivacySecurity from '../pages/Profile/PrivacySecurity.jsx';
import BlockedUsers from '../pages/Profile/BlockedUsers.jsx';
import Following from '../pages/Profile/Following.jsx';
import Followers from '../pages/Profile/Followers.jsx';
import Favorites from '../pages/Profile/Favorites.jsx';
import Level from '../pages/Profile/Level.jsx';
import PublicProfile from '../pages/Users/PublicProfile.jsx';
import BookDetail from '../pages/Books/BookDetail.jsx';
import { PublicationDetailRoute, EventDetailRoute } from '../pages/DetailRoutes.jsx';
import CreatePublication from '../pages/Publications/CreatePublication.jsx';
import PublicationDetails from '../pages/Publications/PublicationDetails.jsx';
import NewOffer from '../pages/Offers/NewOffer.jsx';
import AppShell from '../components/AppShell.jsx';
import RequireAuth from '../auth/RequireAuth.jsx';

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
