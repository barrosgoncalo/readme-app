import React, { useContext, useState, useEffect } from "react";
import { auth, db } from "../../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, initializeUser);
        return unsubscribe;
    }, []);

    async function initializeUser(user) {
        if (user) {
            const isEmailUser = user.providerData.some(p => p.providerId === 'password');
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
    }

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
        refreshUser
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
