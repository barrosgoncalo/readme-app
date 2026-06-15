import React from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/contexts/AuthContext'; 
import AppNavigator from './src/navigation/AppNavigator';

// 1. Import Playfair Bold and Inter Regular
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Inter_400Regular } from '@expo-google-fonts/inter';

SplashScreen.preventAutoHideAsync();

export default function App() {
  // 2. Map them to easy-to-use names
  let [fontsLoaded] = useFonts({
    'Playfair-Bold': PlayfairDisplay_700Bold,
    'Inter-Regular': Inter_400Regular,
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
