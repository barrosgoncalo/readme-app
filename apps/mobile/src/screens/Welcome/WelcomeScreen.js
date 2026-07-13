import React from 'react';
import { View, Text, Image, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { buildStyles } from '../../styles/welcomeStyles';

export default function WelcomeScreen({ navigation }) {
    const colorScheme = useColorScheme();
    const theme = useTheme();
    const styles = buildStyles(theme, colorScheme);

    const completeWelcomeAndNavigate = async (targetRoute) => {
        try {
            await AsyncStorage.setItem('alreadyLaunched', 'true');
        } catch(error) {
            console.error('Error saving launch status:', error);
        } finally {
            navigation.navigate(targetRoute);
        }
    }

    return (
        <View style={styles.container}>
            {/* ─── TOP HALF: IMAGE ─── */}
            <View style={styles.imageContainer}>
                <Image 
                    source={require('../../../assets/images/welcome-bg.png')} 
                    style={styles.image}
                    resizeMode="cover"
                />
            </View>

            {/* ─── BOTTOM HALF: CONTENT ─── */}
            <SafeAreaView style={styles.contentContainer} edges={['bottom']}>
                <View style={styles.textWrapper}>
                    <Text style={styles.title}>
                        Read. Connect.{'\n'}Swap. Repeat.
                    </Text>

                    <Text style={styles.subtitle}>
                        <Text style={styles.subtitle}>
                            Join a community of readers and{'\n'}
                            find your next great book through{'\n'}
                            simple, meaningful swaps.
                        </Text>
                    </Text>
                </View>

                <View style={styles.buttonWrapper}>
                    {/* Primary Button */}
                    <TouchableOpacity 
                        style={styles.primaryButton}
                        onPress={() => completeWelcomeAndNavigate(ROUTES.REGISTER)}
                    >
                        <Text style={styles.primaryButtonText}>Get Started</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.arrowIcon} />
                    </TouchableOpacity>

                    {/* Secondary Link */}
                    <TouchableOpacity 
                        style={styles.secondaryButton}
                        onPress={() => completeWelcomeAndNavigate(ROUTES.LOGIN)}
                    >
                        <Text style={styles.secondaryButtonText}>Already have an Account?</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}
