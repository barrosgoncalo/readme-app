import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { getAuth, signOut } from 'firebase/auth';
import { DB } from '@readme/shared/src/services/DB';

import Login from '../pages/Auth/Login.jsx';
import AdminDashboard from '../pages/Admin/AdminDashboard.jsx';

export default function AppRouter() {
    const authContext = useAuth();
    const { currentUser, userLoggedIn, loading } = authContext;
    
    const [adminRole, setAdminRole] = useState(null);
    const [resolvingRole, setResolvingRole] = useState(true);

    const handleLogout = () => {
        signOut(getAuth());
    };

    // 1. Diagnostic Console Log: Inspect exactly what the Auth Context is exposing
    useEffect(() => {
        console.log("AppRouter Auth Context State:", {
            currentUser,
            userLoggedIn,
            loading,
            contextKeys: Object.keys(authContext),
            // Check if profile/userData is hiding under a different key in your context
            nestedUserData: authContext.userData || authContext.profile || authContext.userProfile || null
        });
    }, [currentUser, userLoggedIn, loading, authContext]);

    // 2. Resolve Role (Context -> Firestore Direct -> Token Claims)
    useEffect(() => {
        const determineRole = async () => {
            if (!userLoggedIn || !currentUser) {
                setAdminRole(null);
                setResolvingRole(false);
                return;
            }

            // Path A: Check if role is directly on the currentUser object
            if (currentUser.role) {
                setAdminRole(currentUser.role);
                setResolvingRole(false);
                return;
            }

            // Path B: Check if context has a secondary user profile object
            const nestedProfile = authContext.userData || authContext.profile || authContext.userProfile;
            if (nestedProfile?.role) {
                setAdminRole(nestedProfile.role);
                setResolvingRole(false);
                return;
            }

            // Path C: Query Firestore directly (Your console log proved this document exists and has the role!)
            try {
                const dbProfile = await DB.get("users", currentUser.uid);
                if (dbProfile?.role) {
                    setAdminRole(dbProfile.role);
                    setResolvingRole(false);
                    return;
                }
            } catch (err) {
                console.warn("Direct Firestore role query failed, trying token claims:", err);
            }

            // Path D: Read Cryptographic Custom Token Claims (Your bootstrap script assigned this!)
            try {
                const tokenResult = await currentUser.getIdTokenResult();
                if (tokenResult.claims?.role) {
                    setAdminRole(tokenResult.claims.role);
                } else {
                    setAdminRole('user'); // Fallback to basic user if nothing else is found
                }
            } catch (err) {
                console.error("Failed to parse cryptographic claims:", err);
                setAdminRole('user');
            } finally {
                setResolvingRole(false);
            }
        };

        determineRole();
    }, [currentUser, userLoggedIn, authContext]);

    // Show loading state if auth state is initializing OR if we are resolving the admin role
    if (loading || (userLoggedIn && resolvingRole)) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#121212', color: '#fff', fontFamily: 'sans-serif' }}>
                <h3>Loading Admin System...</h3>
            </div>
        );
    }

    return (
        <Routes>
            {/* 1. Unauthenticated Gate */}
            {!userLoggedIn ? (
                <>
                    <Route path="/login" element={<Login />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </>
            ) : (
                /* 2. Authenticated Routes (Only for Admins) */
                <>
                    {adminRole === 'admin' ? (
                        <>
                            <Route path="/admin" element={<AdminDashboard />} />
                            <Route path="*" element={<Navigate to="/admin" replace />} />
                        </>
                    ) : (
                        /* 3. Restricted Trap (For Non-Admins attempting access) */
                        <Route
                            path="*"
                            element={
                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    justifyContent: 'center', 
                                    alignItems: 'center', 
                                    height: '100vh', 
                                    fontFamily: 'sans-serif',
                                    backgroundColor: '#1a1a1a',
                                    color: '#fff',
                                    padding: 20
                                }}>
                                    <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>🛡️ Access Restricted</h2>
                                    <p style={{ color: '#aaa', marginBottom: '25px', textAlign: 'center' }}>
                                        This console is exclusively reserved for system administrators.
                                    </p>
                                    <button 
                                        onClick={handleLogout}
                                        style={{
                                            padding: '12px 24px',
                                            backgroundColor: '#dc3545',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 4,
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '15px'
                                        }}
                                    >
                                        Return to Login
                                    </button>
                                </div>
                            }
                        />
                    )}
                </>
            )}
        </Routes>
    );
}
