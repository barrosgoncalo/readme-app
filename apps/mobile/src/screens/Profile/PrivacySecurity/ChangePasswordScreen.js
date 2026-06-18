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
    useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { EyeIcon, EyeClosedIcon } from 'phosphor-react-native';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { doUpdateUserPassword } from '@readme/shared/src/services/auth'
import { buildPasswordStyles } from '../../../styles/passwordStyles'; 

export default function ChangePasswordScreen({ navigation }) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isSaving, setIsSaving] = useState(false);

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const styles = buildPasswordStyles(theme);

    const isAnyEmpty = !oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim();

    const handleSave = async () => {

        if( newPassword !== confirmPassword ) {
            alert("New passwords do not match!");
            return;
        }

        setIsSaving(true);

        try {
        await doUpdateUserPassword(oldPassword, newPassword);
        navigation.navigate(ROUTES.PASSWORD_SUCCESS); 
    } catch (error) {
        console.error("Update password error:", error);
        alert(error.message || "Failed to update password. Please check your credentials.");
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
                            resizeMode="contain"
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
                            <View style={styles.passwordContainer}>
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
                                        ? <EyeClosedIcon size={22} color={theme.primary || '#000'} />
                                        : <EyeIcon size={22} color={theme.primary || '#000'} />
                                    }
                                </TouchableOpacity>
                            </View>
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
                                    placeholderTextColor="#aaa"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword
                                        ? <EyeClosedIcon size={22} color={theme.primary || '#000'} />
                                        : <EyeIcon size={22} color={theme.primary || '#000'} />
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
                                <ActivityIndicator color="#fff" />
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
