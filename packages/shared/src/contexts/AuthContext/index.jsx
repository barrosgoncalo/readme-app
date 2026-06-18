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
        // Apenas um listener aqui, que chama a nossa função completa
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
                    const docRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        // Combina o Auth com o Firestore
                        setCurrentUser({ ...user, ...docSnap.data() }); 
                    } else {
                        setCurrentUser({ ...user });
                    }
                    setUserLoggedIn(true);
                } catch (error) {
                    console.error("Erro a buscar dados do Firestore:", error);
                    setCurrentUser({ ...user });
                    setUserLoggedIn(true);
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
                const userDocRef = doc(db, "users", auth.currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    // Atualiza o estado com os dados mais recentes do Firestore
                    setCurrentUser({
                        uid: auth.currentUser.uid,
                        email: auth.currentUser.email,
                        ...userDocSnap.data()
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
