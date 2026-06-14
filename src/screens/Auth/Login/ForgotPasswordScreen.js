import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ActivityIndicator, 
    ScrollView, 
    Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

// Import your Auth logic
import { doPasswordReset } from '../../../services/auth';

// Import your themes and styles (Adjust paths as needed!)
import { Colors } from '../../../constants/theme';
import { buildStyles } from '../../../styles/authStyles';

export default function ForgotPasswordScreen({ navigation }) {
    // 1. Dynamic Theme Setup
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme);

    // 2. State Management
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 3. Reset Logic
    const handlePasswordReset = async () => {
        if (!email.trim()) {
            Alert.alert("Missing Input", "Please enter your email address.");
            return;
        }

        setIsLoading(true);
        try {
            // Call your Firebase method from auth.js
            await doPasswordReset(email.trim());
            
            Alert.alert(
                "Email Sent", 
                "Check your inbox for a link to reset your password.",
                [{ text: "Back to Login", onPress: () => navigation.navigate('Login') }]
            );
        } catch (error) {
            console.error("Reset Password Error:", error);
            // Firebase throws specific errors, but we can provide a generic fallback
            Alert.alert("Error", error.message || "Failed to send reset email. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                
                {/* ─── HEADER ─── */}
                <View style={styles.header}>
                    <Text style={styles.eyebrow}>Recovery</Text>
                    <Text style={styles.title}>Reset Password</Text>
                </View>

                {/* ─── BODY / INPUTS ─── */}
                <View style={styles.body}>
                    
                    <Text style={{ color: theme.text, fontSize: 15, marginBottom: 20, lineHeight: 22 }}>
                        Enter the email address associated with your account, and we will send you a link to reset your password.
                    </Text>

                    {/* Email Input */}
                    <TextInput
                        placeholder="Email Address"
                        value={email}
                        onChangeText={setEmail}
                        style={styles.input}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        placeholderTextColor="#aaa"
                    />

                    {/* Submit Button */}
                    <TouchableOpacity 
                        style={styles.primaryButton} 
                        onPress={handlePasswordReset}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Send Reset Link</Text>
                        )}
                    </TouchableOpacity>

                    {/* Footer Link to return to Login */}
                    <View style={styles.loginFooter}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.loginLink}>Back to Login</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
