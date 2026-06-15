import React from 'react';
import { View, Text, Image, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { buildStyles } from '../../styles/welcomeStyles';

export default function WelcomeScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme, colorScheme);

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
                        onPress={() => navigation.navigate(ROUTES.REGISTER)}
                    >
                        <Text style={styles.primaryButtonText}>Get Started</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.arrowIcon} />
                    </TouchableOpacity>

                    {/* Secondary Link */}
                    <TouchableOpacity 
                        style={styles.secondaryButton}
                        onPress={() => navigation.navigate(ROUTES.LOGIN)}
                    >
                        <Text style={styles.secondaryButtonText}>Already have an Account?</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}
