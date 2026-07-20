import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@readme/shared/src/contexts/AuthContext';
import { OfferProvider } from '@readme/shared/src/contexts/OfferContext';
import { CounterOfferProvider } from '@readme/shared/src/contexts/CounterOfferContext';
import AppNavigator from './src/navigation/AppNavigator';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';

import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold  } from '@expo-google-fonts/inter';

SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs([
  "SafeAreaView has been deprecated and will be removed in a future release"
]);

export default function App() {
    let [fontsLoaded] = useFonts({
        'Playfair-Bold': PlayfairDisplay_700Bold,
        'Inter-Regular': Inter_400Regular,
        'Inter-SemiBold': Inter_600SemiBold,
        'Inter-Bold': Inter_700Bold,
    });

    useEffect(() => {
        if (Platform.OS === 'android') {
            // 1. Draw behind the system bar area
            NavigationBar.setPositionAsync('absolute');
            // 2. Make the background completely transparent
            NavigationBar.setBackgroundColorAsync('#ffffff00');

            // 3. FORCE HIDE THE BUTTONS (Immersive Mode)
            NavigationBar.setVisibilityAsync('hidden');
            // 4. Tell Android to let the user swipe from the edge to see them again
            NavigationBar.setBehaviorAsync('overlay-swipe');
        }
    }, []);


    if (!fontsLoaded) {
        return null;
    }

    return (
        <AuthProvider>
            <OfferProvider>
                <CounterOfferProvider>
                    <AppNavigator />
                </CounterOfferProvider>
            </OfferProvider>
        </AuthProvider>
    );
}
