import React, { useContext, useState, useEffect } from "react";
import { auth } from "../../services/firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext= React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const[currentUser, setCurrentUser] = useState(null);
    const[userLoggedIn, setUserLoggedIn] = useState(false);
    const[loading, setLoading] = useState(true);



    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, initializeUser);
        return unsubscribe;
    }, [])

    async function initializeUser(user) {
    if (user) {
        const isEmailUser = user.providerData.some(p => p.providerId === 'password');

        if (isEmailUser && !user.emailVerified) {
            setCurrentUser(null);
            setUserLoggedIn(false);
        } else {
            setCurrentUser({ ...user });
            setUserLoggedIn(true);
        }
    } else {
        setCurrentUser(null);
        setUserLoggedIn(false);
    }
    setLoading(false);
}

    const value = {
        currentUser,
        userLoggedIn,
        loading
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
