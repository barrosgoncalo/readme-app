// src/navigation/AppNavigator.js
import React from 'react'; // Removed useState because we don't need it anymore!
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native'; // Added for the loading spinner

// 1. Import your custom context hook
import { useAuth } from '../contexts/AuthContext'; 

// Import your screens
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/Register/RegisterScreen';
import AppTabs from '../components/app-tabs'; 

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  // 2. Grab the real, live Firebase states from your context cloud!
  const { userLoggedIn, loading } = useAuth(); 

  // 3. If Firebase is still checking the auth status, show a spinner
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#208AEF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userLoggedIn ? (
          // IF REALLY LOGGED IN -> Show the Main App
          <Stack.Screen name="Main" component={AppTabs} />
        ) : (
          // IF NOT LOGGED IN -> Show the Auth Flow
          <>
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
