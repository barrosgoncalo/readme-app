import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';
import { doCreateUserWithEmailAndPassword, doSignInWithGoogle } from '../../services/auth';

export default function RegisterScreen({ navigation }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    // --- Password Strength Helper Lgc ---
    const getPasswordStrength = () => {
        if (password.length === 0) return { label: '', color: 'transparent' };
        if (password.length < 6) return { label: 'Too Short (Min 6 chars)', color: '#D32F2F' };

        // Check for complexity (numbers + mixed case)
        const hasNumbers = /\d/.test(password);
        const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);

        if (password.length >= 10 && hasNumbers && hasMixedCase) {
            return { label: 'Strong 💪', color: '#388E3C' };
        }
        return { label: 'Medium 😐', color: '#F57C00' };
    };

    const strength = getPasswordStrength();

    const handleRegister = async () => {
        const cleanedEmail = email.trim();
        if (!username || !cleanedEmail || !password) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }
        if (password.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters.");
            return;
        }

        setIsRegistering(true);
        try {
            await doCreateUserWithEmailAndPassword(username, cleanedEmail, password);
        } catch (error) {
            setIsRegistering(false);

            // --- Duplicate Email Testing Handler ---
            if (error.code === 'auth/email-already-in-use') {
                Alert.alert("Account Exists", "This email address is already registered! Try logging in instead.");
            } else {
                Alert.alert("Registration Failed", error.message);
            }
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setIsRegistering(true); 
            await doSignInWithGoogle();
            // O teu AuthContext vai detetar o login automaticamente e mudar de ecrã sozinho!
        } catch (error) {
            Alert.alert("Google Sign-In Falhou", error.message);
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>

        <TextInput 
        placeholder="Username" 
        value={username} 
        onChangeText={setUsername} 
        style={styles.input} 
        />

        <TextInput 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        style={styles.input} 
        autoCorrect={false}
        autoCapitalize="none"
        keyboardType="email-address"
        />

        <TextInput 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
        style={styles.input} 
        />

        {/* Password Strength Visual Indicator */}
        {strength.label ? (
            <Text style={[styles.strengthText, { color: strength.color }]}>
            Password Strength: {strength.label}
            </Text>
        ) : null}

        <Button 
        title={isRegistering ? "Creating Account..." : "Register"} 
        onPress={handleRegister} 
        disabled={isRegistering}
        />

        <Text style={styles.divider}>──────── OR ────────</Text>

        {/* Styled Google Button */}
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
        <Text style={styles.googleButtonText}>🔵 Sign up with Google</Text>
        </TouchableOpacity>

        <Button 
        title="Already have an account? Log in" 
        onPress={() => navigation.navigate('Login')} 
        color="gray"
        />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginVertical: 8, borderRadius: 8 },
    strengthText: { fontSize: 14, fontWeight: '600', marginBottom: 15, marginLeft: 4 },
    divider: { textAlign: 'center', color: '#aaa', marginVertical: 20, fontSize: 12 },
    googleButton: { 
        borderWidth: 1, 
        borderColor: '#4285F4', 
        padding: 14, 
        borderRadius: 8, 
        alignItems: 'center', 
        marginBottom: 15 
    },
    googleButtonText: { color: '#4285F4', fontWeight: 'bold', fontSize: 16 }
});
