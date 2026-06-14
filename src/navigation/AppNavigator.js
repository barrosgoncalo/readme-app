import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import SplashScreen from '../screens/Splash/SplashScreen';
import { useAuth } from '../contexts/AuthContext'; 
import { Routes } from '../constants/routes';

// Import your screens
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/Register/RegisterScreen';
import AppTabs from '../components/app-tabs'; 

const Stack = createNativeStackNavigator();

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
                    // IF LOGGED IN -> Show the Main App
                    <Stack.Screen name={Routes.Main} component={AppTabs} />
                ) : (
                    // IF NOT LOGGED IN -> Show the Auth Flow
                    <>
                        <Stack.Screen name={Routes.Splash} component={SplashScreen} options={{ headerShown: false }} />
                        <Stack.Screen name={Routes.Register} component={RegisterScreen} />
                        <Stack.Screen name={Routes.Login} component={LoginScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
