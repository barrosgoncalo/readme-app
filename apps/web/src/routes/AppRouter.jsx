import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { getAuth, signOut } from 'firebase/auth';
import { DB } from '@readme/shared/src/services/DB';

import Login from '../pages/Auth/Login.jsx';
import UsersPage from '../pages/Admin/UsersPage.jsx';
import ReportsPage from '../pages/Admin/Reports/ReportsPage.jsx';
import AdminShell from '../components/AdminShell.jsx';

export default function AppRouter() {
    const authContext = useAuth();
    const { currentUser, userLoggedIn, loading } = authContext;

    const [adminRole, setAdminRole] = useState(null);
    const [resolvingRole, setResolvingRole] = useState(true);

    const handleLogout = () => signOut(getAuth());

    useEffect(() => {
        const determineRole = async () => {
            if (!userLoggedIn || !currentUser) {
                setAdminRole(null);
                setResolvingRole(false);
                return;
            }

            if (currentUser.role) {
                setAdminRole(currentUser.role);
                setResolvingRole(false);
                return;
            }

            const nestedProfile = authContext.userData || authContext.profile || authContext.userProfile;
            if (nestedProfile?.role) {
                setAdminRole(nestedProfile.role);
                setResolvingRole(false);
                return;
            }

            try {
                const dbProfile = await DB.get('users', currentUser.uid);
                if (dbProfile?.role) {
                    setAdminRole(dbProfile.role);
                    setResolvingRole(false);
                    return;
                }
            } catch (err) {
                console.warn('Direct Firestore role query failed, trying token claims:', err);
            }

            try {
                const tokenResult = await currentUser.getIdTokenResult();
                setAdminRole(tokenResult.claims?.role || 'user');
            } catch (err) {
                console.error('Failed to parse token claims:', err);
                setAdminRole('user');
            } finally {
                setResolvingRole(false);
            }
        };

        determineRole();
    }, [currentUser, userLoggedIn, authContext]);

    if (loading || (userLoggedIn && resolvingRole)) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8f9fb', color: '#6b7280', fontFamily: 'sans-serif' }}>
                <h3>Loading…</h3>
            </div>
        );
    }

    return (
        <Routes>
            {!userLoggedIn ? (
                <>
                    <Route path="/login" element={<Login />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </>
            ) : adminRole === 'admin' ? (
                <>
                    <Route element={<AdminShell />}>
                        <Route path="/admin/users"   element={<UsersPage />} />
                        <Route path="/admin/reports" element={<ReportsPage />} />
                    </Route>
                    <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
                    <Route path="*"     element={<Navigate to="/admin/users" replace />} />
                </>
            ) : (
                <Route
                    path="*"
                    element={
                        <div style={{
                            display: 'flex', flexDirection: 'column', justifyContent: 'center',
                            alignItems: 'center', height: '100vh', fontFamily: 'sans-serif',
                            backgroundColor: '#f8f9fb', color: '#111827', padding: 20
                        }}>
                            <h2 style={{ fontSize: '28px', marginBottom: '10px' }}>Access Restricted</h2>
                            <p style={{ color: '#6b7280', marginBottom: '25px', textAlign: 'center' }}>
                                This console is exclusively reserved for system administrators.
                            </p>
                            <button
                                onClick={handleLogout}
                                style={{ padding: '10px 20px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                            >
                                Return to Login
                            </button>
                        </div>
                    }
                />
            )}
        </Routes>
    );
}
