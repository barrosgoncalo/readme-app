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

// IMPORT STATUS CODES FOR GOOGLE SIGN IN
import { statusCodes } from '@react-native-google-signin/google-signin';

import { 
    doSignInWithEmailAndPassword, 
    doGetGoogleTokenAndProfile, 
    doSignInWithGoogleCredential
} from '@readme/shared/src/services/auth';

import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { buildAuthStyles } from '../../../styles/authStyles';
import { buildPasswordStyles } from '../../../styles/passwordStyles';

export default function LoginScreen({ navigation }) {

    const theme = useTheme();
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
            
        } catch (error) {
            // 1. CATCH SPECIFIC GOOGLE ERRORS
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                console.log("User cancelled the login flow.");
                // Fail silently, do not show an alert to the user
                return;
            } 
            else if (error.code === statusCodes.IN_PROGRESS) {
                console.log("Sign in is already in progress.");
                return;
            } 
            else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert("Error", "Google Play Services are not available on this device.");
            }
            
            // 2. CATCH UNREGISTERED USER ERRORS
            // (Adjust this check based on exactly what error your backend/Firebase throws)
            else if (
                error.message?.includes('user-not-found') || 
                error.code === 'auth/user-not-found'
            ) {
                Alert.alert(
                    "Account Not Found", 
                    "No account exists for this Google email. Please register first."
                );
            } 
            
            // 3. FALLBACK FOR ANY OTHER ERRORS
            else {
                console.error("Google Auth Error:", error);
                Alert.alert("Google Login Failed", error.message || "An unexpected error occurred.");
            }
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
