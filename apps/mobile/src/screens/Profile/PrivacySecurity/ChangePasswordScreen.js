import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    Image, 
    KeyboardAvoidingView, 
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { EyeIcon, EyeClosedIcon } from 'phosphor-react-native';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { doUpdateUserPassword } from '@readme/shared/src/services/auth'
import { buildPasswordStyles } from '../../../styles/passwordStyles'; 
import {
    getPasswordDetails,
    hasMixedCase,
    hasNumbers,
    hasValidLength,
} from '@readme/shared/src/utils/registerUtils';

export default function ChangePasswordScreen({ navigation }) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isSaving, setIsSaving] = useState(false);

    const theme = useTheme();

    const styles = buildPasswordStyles(theme);

    const isAnyEmpty = !oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim();
    const passwordInfo = getPasswordDetails(newPassword);

    const isValidPassword = (password) => {
        if (passwordInfo.level !== 'strong') {
            const missing = [];
            if ( !hasValidLength(password) ) {
                missing.push('At least 6 characters');
            }
            if ( !hasNumbers(password) ) {
                missing.push('At least one number');
            }
            if ( !hasMixedCase(password) ) {
                missing.push('uppercase and lowercase letters');
            }

            Alert.alert('Weak Password', `Your password needs:\n• ${missing.join('\n• ')}`);
            return false;
        }
        return true;
    };

    const handleSave = async () => {

        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "New passwords do not match!");
            return;
        }

        if (oldPassword === newPassword) {
            Alert.alert("Error", "Your new password cannot be the same as your old password.");
            return;
        }

        if (!isValidPassword(newPassword)) {
            return;
        }

        setIsSaving(true);

        try {
            await doUpdateUserPassword(oldPassword, newPassword);
            navigation.navigate(ROUTES.PASSWORD_SUCCESS); 
        } catch (error) {
            console.log("Handled password update screen error:", error.message);
            Alert.alert("Error", error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* --- HEADER --- */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Iconify icon="lucide:arrow-left" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Change Password</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {/* --- HEADER TEXTS --- */}
                    <View style={styles.textContainer}>
                        <Text style={styles.mainHeading}>Choose New Password</Text>
                        <Text style={styles.subHeading}>
                            Enter and confirm your new password{'\n'}
                            to regain access
                        </Text>
                    </View>

                    {/* --- ILLUSTRATION --- */}
                    <View style={styles.imageContainer}>
                        <Image 
                            source={require('../../../../assets/images/ShieldWorm.png')} 
                            style={styles.illustration}
                            contentFit="contain"
                        />
                    </View>

                    {/* --- FORM FIELDS --- */}
                    <View style={styles.formContainer}>

                        {/* Old Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Old Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={oldPassword}
                                    onChangeText={setOldPassword}
                                    secureTextEntry={!showOldPassword}
                                    autoCapitalize="none"
                                    placeholderTextColor="#aaa"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowOldPassword(!showOldPassword)}
                                >
                                    {showOldPassword
                                        ? <EyeClosedIcon size={22} color={theme.primary || '#000'} />
                                        : <EyeIcon size={22} color={theme.primary || '#000'} />
                                    }
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* New Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>New Password</Text>
                            <View style={[
                                styles.passwordContainer,
                                { 
                                    borderBottomColor: passwordInfo.color, 
                                    borderBottomWidth: passwordInfo.level === 'none' ? 1 : 2.5
                                }
                            ]}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry={!showNewPassword}
                                    autoCapitalize="none"
                                    placeholderTextColor="#aaa"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword
                                        ? <EyeClosedIcon size={22} color={theme.primary} />
                                        : <EyeIcon size={22} color={theme.primary} />
                                    }
                                </TouchableOpacity>
                            </View>

                            {/* Cleaned up Text component */}
                            {passwordInfo.label ? (
                                <Text style={[styles.strengthText, { color: passwordInfo.color }]}>
                                    {passwordInfo.label}
                                </Text>
                            ) : null}
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword
                                        ? <EyeClosedIcon size={22} color={theme.primary} />
                                        : <EyeIcon size={22} color={theme.primary} />
                                    }
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Submit Changed */}
                        <TouchableOpacity
                            style={[
                                styles.submitBtn,
                                isAnyEmpty && styles.submitBtnDisabled,
                                isSaving && { opacity: 0.7 },
                            ]}
                            onPress={handleSave}
                            disabled={isAnyEmpty || isSaving}
                            activeOpacity={0.85}
                        >
                            {isSaving ? (
                                <ActivityIndicator color={theme.buttonText} />
                            ) : (
                                    <Text style={[styles.submitText, isAnyEmpty && styles.submitTextDisabled]}>
                                        SAVE CHANGES
                                    </Text>
                                )}
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
