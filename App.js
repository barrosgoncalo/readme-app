import React from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/contexts/AuthContext'; 
import AppNavigator from './src/navigation/AppNavigator';

import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold  } from '@expo-google-fonts/inter';

SplashScreen.preventAutoHideAsync();

export default function App() {
    let [fontsLoaded] = useFonts({
        'Playfair-Bold': PlayfairDisplay_700Bold,
        'Inter-Regular': Inter_400Regular,
        'Inter-SemiBold': Inter_600SemiBold,
        'Inter-Bold': Inter_700Bold,
    });


    if (!fontsLoaded) {
        return null;
    }

    return (
        <AuthProvider>
            <AppNavigator />
        </AuthProvider>
    );
}
