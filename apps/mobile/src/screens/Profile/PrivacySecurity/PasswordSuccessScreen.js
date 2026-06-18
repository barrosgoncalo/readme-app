import React from 'react';
import { View, Text, TouchableOpacity, Platform, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { buildSuccessStyles } from '../../../styles/successStyles';
import {
    getPasswordDetails,
    hasLowerCase,
    hasUpperCase,
    hasMixedCase,
    hasNumbers,
    hasValidLength,
} from '@readme/shared/src/utils/registerUtils';

export default function PasswordChangedSuccessScreen({ navigation }) {

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildSuccessStyles(theme);

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* --- HEADER --- */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
            </View>

            {/* --- MAIN CONTENT --- */}
            <View style={styles.content}>
                
                {/* --- SHADOWED ICON CONTAINER --- */}
                <View style={styles.iconWrapper}>
                    <Iconify 
                        icon="material-symbols-light:verified-rounded" 
                        size={200} 
                        color={theme.verifiedColor}
                    />
                </View>

                {/* --- TEXT CONTENT --- */}
                <Text style={styles.title}>Password changed successfully</Text>
                <Text style={styles.subHeading}>
                    Your password has been changed successfully, click below to close.
                </Text>

                {/* --- BUTTON --- */}
                <TouchableOpacity 
                    style={styles.button}
                    onPress={() => navigation.navigate(ROUTES.MAIN)}
                    activeOpacity={0.8}
                >
                    <Iconify icon="material-symbols-light:home-outline-rounded" size={24} color="#fff" />
                    <Text style={styles.buttonText}>Go to Home</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
