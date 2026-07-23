// Web variant of AuthContext.
// Same behavior as mobile's index.jsx, minus the expo-splash-screen call —
// Vite cannot resolve that module on the web.
import React, { useContext, useState, useEffect, useCallback } from 'react';
import { auth } from '../../services/firebase.web';
import { onAuthStateChanged, reload } from 'firebase/auth';
import { DB } from '../../services/DB';

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userLoggedIn, setUserLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    const initializeUser = useCallback(async (user) => {
        if (user) {
            const isEmailUser = user.providerData.some(p => p.providerId === 'password');
            if (isEmailUser && !user.emailVerified) {
                await reload(user);
            }
            if (isEmailUser && !user.emailVerified) {
                setCurrentUser(null);
                setUserLoggedIn(false);
            } else {
                try {
                    const userData = await DB.get('users', user.uid);
                    if (userData) {
                        setCurrentUser(user);
                        setUserLoggedIn(true);
                    } else {
                        // No Firestore profile yet — e.g. mid-registration Google
                        // account-existence check. Don't treat as a real session.
                        setCurrentUser(null);
                        setUserLoggedIn(false);
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                    setCurrentUser(null);
                    setUserLoggedIn(false);
                }
            }
        } else {
            setCurrentUser(null);
            setUserLoggedIn(false);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, initializeUser);
        return unsubscribe;
    }, [initializeUser]);

    // Call this manually right after signInWithEmailAndPassword. Firebase's
    // SDK does NOT reliably re-fire onAuthStateChanged when re-signing in as
    // an already-signed-in user (same UID), which is exactly what happens
    // when a user retries login after verifying their email — so waiting on
    // the listener alone leaves the context stuck on stale state.
    const checkAuthState = useCallback(async () => {
        await initializeUser(auth.currentUser);
    }, [initializeUser]);

    const value = { currentUser, userLoggedIn, loading, checkAuthState };
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
