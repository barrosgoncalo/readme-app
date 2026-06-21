import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    Image, 
    ActivityIndicator, 
    ScrollView, 
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EyeIcon, EyeClosedIcon } from 'phosphor-react-native';

import { 
    doSignInWithEmailAndPassword, 
    doGetGoogleTokenAndProfile, 
    doSignInWithGoogleCredential
} from '@readme/shared/src/services/auth';

import { useColorScheme } from 'react-native';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { buildAuthStyles } from '../../../styles/authStyles';
import { buildPasswordStyles } from '../../../styles/passwordStyles';

export default function LoginScreen({ navigation }) {

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildAuthStyles(theme);
    const passwordStyles = buildPasswordStyles(theme);

    // State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Handle Email/Password Login
    const handleEmailLogin = async () => {
        if (!email || !password) {
            Alert.alert("Missing Fields", "Please enter both your email and password.");
            return;
        }

        setIsLoading(true);
        try {
            // Using the unified function that includes the Suspension Bouncer
            const { userData } = await doSignInWithEmailAndPassword(email, password);
            console.log("Logged in successfully as:", userData.role);
        } catch (error) {
            Alert.alert("Login Failed", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Google Login
    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            const { idToken, profile } = await doGetGoogleTokenAndProfile();
            await doSignInWithGoogleCredential(idToken, profile);
            console.log("Google Login Successful");
            // TODO: Navigate to Main App
        } catch (error) {
            console.error(error);
            Alert.alert("Google Login Failed", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                
                {/* ─── HEADER ─── */}
                <View style={styles.header}>
                    <Text style={styles.eyebrow}>Welcome Back</Text>
                    <Text style={styles.title}>Sign in to your account</Text>
                </View>

                {/* ─── BODY / INPUTS ─── */}
                <View style={styles.body}>
                    
                    {/* Email Input */}
                    <TextInput
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        style={styles.input}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        placeholderTextColor="#aaa"
                    />

                    {/* Password Input with Toggle */}
                    <View style={passwordStyles.passwordContainer}>
                        <TextInput
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            style={passwordStyles.passwordInput}
                            placeholderTextColor="#aaa"
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            {showPassword 
                                ? <EyeClosedIcon size={22} color={theme.primary} />
                                : <EyeIcon size={22} color={theme.primary} />
                            }
                        </TouchableOpacity>
                    </View>

                    {/* Forgot Password */}
                    <TouchableOpacity 
                        style={styles.forgotPasswordButton} 
                        onPress={() => navigation.navigate(ROUTES.FORGOT_PASSWORD)}
                    >
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <TouchableOpacity 
                        style={styles.primaryButton} 
                        onPress={handleEmailLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.divider}>──────── OR ────────</Text>

                    {/* Google Login Button */}
                    <TouchableOpacity
                        style={styles.googleButton}
                        onPress={handleGoogleSignIn}
                        disabled={isLoading}
                        activeOpacity={0.7}
                    >
                        <Image
                            source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                            style={styles.googleIconImage}
                        />
                        <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </TouchableOpacity>

                    {/* Footer Link to Registration */}
                    <View style={styles.loginFooter}>
                        <Text style={{ color: theme.secondary || '#888' }}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate(ROUTES.REGISTER)}>
                            <Text style={styles.loginLink}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
