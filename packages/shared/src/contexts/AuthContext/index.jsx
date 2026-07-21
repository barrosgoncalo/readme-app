import React, { useContext, useState, useEffect, useCallback } from "react";
import { auth, db } from "../../services/firebase";
import { onAuthStateChanged, reload } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import * as SplashScreen from 'expo-splash-screen'; 

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
                    const tokenResult = await user.getIdTokenResult(true);
                    const tokenRole = tokenResult.claims.role || 'user';
                    const docRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const firestoreData = docSnap.data();
                        setCurrentUser({ 
                            ...user, 
                            ...firestoreData,
                            role: tokenRole,
                            photoURL: firestoreData.photoURL || user.photoURL || null 
                        });
                        setUserLoggedIn(true);
                    } else {
                        // No Firestore profile yet — e.g. a Google account-existence check
                        // mid-registration, where the auth user is momentarily created then
                        // deleted. Don't treat this as a real logged-in session.
                        setCurrentUser(null);
                        setUserLoggedIn(false);
                    }
                } catch (error) {
                    console.error("Erro a buscar dados do Firestore ou Claims:", error);
                    setCurrentUser(null);
                    setUserLoggedIn(false);
                }
            }
        } else {
            setCurrentUser(null);
            setUserLoggedIn(false);
        }
        setLoading(false);
        try {
            await SplashScreen.hideAsync();
        } catch (error) {
            console.warn(error);
        }
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

    const refreshUser = async () => {
        if (auth.currentUser) {
            try {
                const tokenResult = await auth.currentUser.getIdTokenResult(true);
                const tokenRole = tokenResult.claims.role || 'user';

                const userDocRef = doc(db, "users", auth.currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                const firestoreData = userDocSnap.data();

                if (userDocSnap.exists()) {
                    setCurrentUser({
                        ...auth.currentUser,
                        ...firestoreData,
                        role: tokenRole,
                        photoURL: firestoreData.photoURL || auth.currentUser.photoURL || null
                    });
                } else {
                    setCurrentUser({
                        ...auth.currentUser,
                        role: tokenRole
                    });
                }
            } catch (error) {
                console.error("Erro ao atualizar os dados do utilizador:", error);
            }
        }
    };

    const value = {
        currentUser,
        userLoggedIn,
        loading,
        refreshUser,
        checkAuthState
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
