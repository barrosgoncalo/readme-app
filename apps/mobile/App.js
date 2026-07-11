import React from 'react';
import { LogBox } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@readme/shared/src/contexts/AuthContext';
import { OfferProvider } from '@readme/shared/src/contexts/OfferContext';
import AppNavigator from './src/navigation/AppNavigator';

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


    if (!fontsLoaded) {
        return null;
    }

    return (
        <AuthProvider>
            <OfferProvider>
                <AppNavigator />
            </OfferProvider>
        </AuthProvider>
    );
}
