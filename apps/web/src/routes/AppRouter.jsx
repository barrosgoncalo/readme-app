// Web equivalent of apps/mobile/src/navigation/AppNavigator.js.
//   loading      → spinner
//   logged in    → /home (RequireAuth-guarded)
//   logged out   → first launch shows /welcome, returning users go to /login
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';

import Splash from '../pages/Splash.jsx';
import Welcome from '../pages/Welcome.jsx';
import Login from '../pages/Login.jsx';
import ForgotPassword from '../pages/ForgotPassword.jsx';
import Register from '../pages/Register/index.jsx';
import Home from '../pages/Home.jsx';
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
    const loggedOutHome = isFirstLaunch ? '/welcome' : '/login';

    return (
        <Routes>
            <Route
                path="/"
                element={
                    userLoggedIn ? <Navigate to="/home" replace /> : <Navigate to={loggedOutHome} replace />
                }
            />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/register/*" element={<Register />} />
            <Route
                path="/home"
                element={
                    <RequireAuth>
                        <Home />
                    </RequireAuth>
                }
            />
            <Route
                path="*"
                element={<Navigate to={userLoggedIn ? '/home' : '/login'} state={{ from: location }} replace />}
            />
        </Routes>
    );
}
