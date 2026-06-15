import { NavigationContainer } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SplashScreen from '../screens/Splash/SplashScreen';
import { useAuth } from '../contexts/AuthContext'; 
import { ROUTES } from '../constants/routes';

// Import screens
import LoginScreen from '../screens/Auth/Login/LoginScreen';
import ForgotPasswordScreen from '../screens/Auth/Login/ForgotPasswordScreen';
import RegisterScreen from '../screens/Auth/Register/RegisterScreen';
import WelcomeScreen from '../screens/Welcome/WelcomeScreen';
import AppTabs from '../components/app-tabs'; 

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { userLoggedIn, loading: authLoading } = useAuth(); 
    const [isFirstLaunch, setIsFirstLaunch] = useState(null);
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        const checkIsFirstLaunch = async () => {
            try {
                const value = await AsyncStorage.getItem('alreadyLaunched');
                setIsFirstLaunch(value === null);
            } catch(error) {
                setIsFirstLaunch(false);
            }
        };
        checkIsFirstLaunch();
    }, []);

    if (authLoading || isFirstLaunch === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" color="#208AEF" />
            </View>
        );
    }

    const handleSplashFinish = () => {
        setShowSplash(false);
    };

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {userLoggedIn ? (
                    <Stack.Screen name={ROUTES.MAIN} component={AppTabs} />
                ) : (
                        <>
                            {/* Use custom conditional layout trees rather than nested closures */}
                            {showSplash ? (
                                <Stack.Screen name={ROUTES.SPLASH}>
                                    {() => <SplashScreen onFinish={handleSplashFinish} />}
                                </Stack.Screen>
                            ) : (
                                    <>
                                        {isFirstLaunch && (
                                            <Stack.Screen 
                                                name={ROUTES.WELCOME}
                                                component={WelcomeScreen}
                                            />
                                        )}
                                        <Stack.Screen
                                            name={ROUTES.LOGIN}
                                            component={LoginScreen}
                                        />
                                        <Stack.Screen
                                            name={ROUTES.REGISTER}
                                            component={RegisterScreen}
                                        />
                                        <Stack.Screen
                                            name={ROUTES.FORGOT_PASSWORD}
                                            component={ForgotPasswordScreen}
                                        />
                                    </>
                                )}
                        </>
                    )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
