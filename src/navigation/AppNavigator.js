import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import SplashScreen from '../screens/Splash/SplashScreen';
import { useAuth } from '../contexts/AuthContext'; 
import { ROUTES } from '../constants/routes';

// Import your screens
import LoginScreen from '../screens/Auth/Login/LoginScreen';
import ForgotPasswordScreen from '../screens/Auth/Login/ForgotPasswordScreen';
import RegisterScreen from '../screens/Auth/Register/RegisterScreen';
import WelcomeScreen from '../screens/Welcome/WelcomeScreen';
import AppTabs from '../components/app-tabs'; 

const Stack = createNativeStackNavigator();

let hasSeenSplash = false;

export const setHasSeenSplash = () => { hasSeenSplash = true; }

export default function AppNavigator() {
    const { userLoggedIn, loading } = useAuth(); 

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
                    <Stack.Screen name={ROUTES.MAIN} component={AppTabs} />
                ) : (
                        <>
                            { !hasSeenSplash ? (
                                <Stack.Screen
                                    name={ROUTES.SPLASH}
                                    component={SplashScreen}
                                />
                            ) : null}
                            <Stack.Screen name={ROUTES.WELCOME} component={WelcomeScreen} />
                            <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
                            <Stack.Screen name={ROUTES.REGISTER} component={RegisterScreen} />
                            <Stack.Screen name={ROUTES.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
                        </>
                    )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
