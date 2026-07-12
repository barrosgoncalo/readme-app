import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ActivityIndicator, 
    ScrollView, 
    Alert,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doPasswordReset } from '@readme/shared/src/services/auth';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { buildAuthStyles } from '../../../styles/authStyles';

export default function ForgotPasswordScreen({ navigation }) {
    const theme = useTheme();
    const styles = buildAuthStyles(theme);

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handlePasswordReset = async () => {
        if (!email.trim()) {
            Alert.alert("Missing Input", "Please enter your email address.");
            return;
        }
        setIsLoading(true);
        try {
            await doPasswordReset(email.trim());
            Alert.alert(
                "Email Sent", 
                "Check your inbox for a link to reset your password.",
                [{ text: "Back to Login", onPress: () => navigation.navigate('Login') }]
            );
        } catch (error) {
            console.error("Reset Password Error:", error);
            Alert.alert("Error", error.message || "Failed to send reset email. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.eyebrow}>Recovery</Text>
                    <Text style={styles.title}>Reset Password</Text>
                </View>
                <Image
                    source={require('../../../../assets/images/ForgotPassword.png')}
                    style={styles.forgotPasswordImage}
                    resizeMode="contain"
                />
                <View style={styles.body}>
                    <Text style={{ color: theme.text, fontSize: 15, marginBottom: 20, lineHeight: 22 }}>
                        Enter the email address associated with your account, and we will send you a link to reset your password.
                    </Text>
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
