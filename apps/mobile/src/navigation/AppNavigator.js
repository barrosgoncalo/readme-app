import { NavigationContainer } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { ROUTES } from '@readme/shared/src/constants/routes';

// Import screens
import SplashScreen from '../screens/Splash/SplashScreen';
import WelcomeScreen from '../screens/Welcome/WelcomeScreen';
import RegisterScreen from '../screens/Auth/Register/RegisterScreen';
import LoginScreen from '../screens/Auth/Login/LoginScreen';
import ForgotPasswordScreen from '../screens/Auth/Login/ForgotPasswordScreen';
import EditProfileScreen from '../screens/Profile/EditProfile/EditProfileScreen';
import PrivacySecurityScreen from '../screens/Profile/PrivacySecurity/PrivacySecurityScreen'
import ChangePasswordScreen from '../screens/Profile/PrivacySecurity/ChangePasswordScreen'
import PasswordSuccessScreen from '../screens/Profile/PrivacySecurity/PasswordSuccessScreen'
import BlockedUsersScreen from '../screens/Profile/BlockedUsers/BlockedUsersScreen';
import BarcodeScannerScreen from '../screens/Shelf/BarcodeScannerScreen';
import SearchBookScreen from '../screens/Shelf/SearchBookScreen';
import BookDetailsScreen from '../screens/Shelf/BookDetailsScreen';
import SearchScreen from '../screens/Explore/SearchScreen';
import CreatePublicationScreen from '../screens/Publication/CreatePublicationScreen';
import PublicationDetailsScreen from '../screens/Explore/PublicationDetails/PublicationDetailsScreen';
import StepOneOffer from '../screens/Explore/PublicationDetails/StepOneOfferScreen';
import StepTwoOffer from '../screens/Explore/PublicationDetails/StepTwoOfferScreen';
import PublicProfileScreen from '../screens/Explore/PublicProfileScreen';
import FavoritesScreen from '../screens/Favorites/FavoritesScreen';
import ChatRoomScreen from '../screens/Chat/ChatRoomScreen';
import SelectSwapBookScreen from '../screens/Chat/SelectSwapBookScreen';


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
                    <>
                        <Stack.Screen name={ROUTES.MAIN} component={AppTabs} />

                        <Stack.Screen 
                            name={ROUTES.EDIT_PROFILE} 
                            component={EditProfileScreen} 
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen 
                            name={ROUTES.PRIVACY_SECURITY} 
                            component={PrivacySecurityScreen} 
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen 
                            name={ROUTES.CHANGE_PASSWORD} 
                            component={ChangePasswordScreen} 
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen 
                            name={ROUTES.PASSWORD_SUCCESS} 
                            component={PasswordSuccessScreen} 
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen 
                            name={ROUTES.BLOCKED_USERS} 
                            component={BlockedUsersScreen} 
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen 
                            name={ROUTES.BARCODE_SCANNER} 
                            component={BarcodeScannerScreen} 
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen 
                            name={ROUTES.SEARCH_BOOK} 
                            component={SearchBookScreen} 
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name={ROUTES.BOOK_DETAILS}
                            component={BookDetailsScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name={ROUTES.SEARCH}
                            component={SearchScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name={ROUTES.PUBLICATION}
                            component={CreatePublicationScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name={ROUTES.PUBLICATION_DETAILS}
                            component={PublicationDetailsScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen 
                            name={ROUTES.STEP_ONE_OFFER} 
                            component={StepOneOffer} 
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen 
                            name={ROUTES.STEP_TWO_OFFER} 
                            component={StepTwoOffer} 
                            options={{ headerShown: false }} 
                        />
                        <Stack.Screen 
                            name={ROUTES.PUBLIC_PROFILE_SCREEN} 
                            component={PublicProfileScreen} 
                            options={{ headerShown: false }} 
                        />
                        <Stack.Screen 
                            name={ROUTES.FAVORITES} 
                            component={FavoritesScreen} 
                            options={{ headerShown: false }} 
                        />
                        <Stack.Screen 
                            name={ROUTES.CHAT_ROOM} 
                            component={ChatRoomScreen} 
                            options={{ headerShown: false }} 
                        />
                        <Stack.Screen 
                            name={ROUTES.SELECT_SWAP} 
                            component={SelectSwapBookScreen} 
                            options={{ headerShown: false }} 
                        />
                    </>
                ) : (
                        <>
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
