import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    KeyboardAvoidingView, 
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { EyeIcon, EyeClosedIcon } from 'phosphor-react-native';
import { 
    getAuth, 
    updatePassword, 
    reauthenticateWithCredential, 
    GoogleAuthProvider 
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { buildPasswordStyles } from '../../styles/passwordStyles';
import {
    getPasswordDetails,
    hasMixedCase,
    hasNumbers,
    hasValidLength,
} from '@readme/shared/src/utils/registerUtils';

export default function SetPasswordScreen({ navigation }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isSaving, setIsSaving] = useState(false);

    const theme = useTheme();
    const styles = buildPasswordStyles(theme);

    const auth = getAuth();
    const user = auth.currentUser;

    const isAnyEmpty = !newPassword.trim() || !confirmPassword.trim();
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
            Alert.alert("Error", "Passwords do not match!");
            return;
        }

        if (!isValidPassword(newPassword)) {
            return;
        }

        setIsSaving(true);

        try {
            await updatePassword(user, newPassword);
            showSuccessAlert();
        } catch (error) {
            console.log("Handled password setup error:", error.message);
            
            // If Firebase demands a recent login, handle it without logging the user out
            if (error.code === 'auth/requires-recent-login') {
                try {
                    // 1. Force a fresh Google Sign-In to get a real token!
                    await GoogleSignin.hasPlayServices();
                    const response = await GoogleSignin.signIn();

                    // 2. Safely extract the token (handles both newer v11+ and older library versions)
                    const idToken = response?.data?.idToken || response?.idToken;

                    if (!idToken) {
                        // Adding a console.log here helps debug if Google is returning something unexpected
                        console.log("Full Google Sign-In Response:", JSON.stringify(response));
                        throw new Error("No ID token found. Check your console to see what Google returned.");
                    }

                    // 2. Build the Firebase credential using the REAL token
                    const credential = GoogleAuthProvider.credential(idToken);

                    // 3. Re-authenticate the user behind the scenes
                    await reauthenticateWithCredential(user, credential);

                    // 4. Retry the password update now that the session is fresh
                    await updatePassword(user, newPassword);
                    showSuccessAlert();
                } catch (reauthError) {
                    console.log("Re-authentication failed:", reauthError);
                    Alert.alert(
                        "Authentication Failed", 
                        "We couldn't verify your Google account. Please log out and try again."
                    );
                }
            } else {
                Alert.alert("Error", error.message);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const showSuccessAlert = () => {
        Alert.alert(
            "Success", 
            "Password created successfully! You can now log in with your email and password.", 
            [{ text: "OK", onPress: () => navigation.goBack() }]
        );
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
                        <Text style={styles.headerTitle}>Create Password</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {/* --- HEADER TEXTS --- */}
                    <View style={styles.textContainer}>
                        {/* Added a slight bottom margin to push the subtitle down */}
                        <Text style={[styles.mainHeading, { marginBottom: 8 }]}>Add a Password</Text>

                        <Text style={styles.subHeading}>
                            Adding a password allows you to log in with{'\n'}
                            {user?.email || 'your email'} instead of Google.
                        </Text>
                    </View>

                    {/* ADD THIS SPACER TO REPLACE THE IMAGE'S HEIGHT */}
                    <View style={{ height: 32 }} /> 

                    {/* --- FORM FIELDS --- */}
                    {/* You can also add marginTop here if the spacer isn't enough */}
                    <View style={[styles.formContainer, { marginTop: 16 }]}>

                        {/* Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
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

                        {/* Submit Button */}
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
                                    SAVE PASSWORD
                                </Text>
                            )}
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
