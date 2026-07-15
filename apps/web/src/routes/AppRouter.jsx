import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { getAuth, signOut } from 'firebase/auth';

import Login from '../pages/Auth/Login.jsx';
import AdminDashboard from '../pages/Admin/AdminDashboard.jsx';

export default function AppRouter() {
    const { currentUser, userLoggedIn, loading } = useAuth();

    const handleLogout = () => {
        signOut(getAuth());
    };

    if (loading) {
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
                    {currentUser?.role === 'admin' ? (
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
