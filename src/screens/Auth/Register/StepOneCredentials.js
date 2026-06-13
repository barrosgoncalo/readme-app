import React from 'react';
import { View, TextInput, Text, TouchableOpacity, Image } from 'react-native';
import { EyeIcon, EyeClosedIcon } from 'phosphor-react-native';

export default function StepOneCredentials({
    username, setUsername,
    fullName, setFullName,
    email, setEmail,
    password, setPassword,
    showPassword, setShowPassword,
    passwordInfo, setShowDatePicker,
    styles, theme,
    handleStep1Next, handleGoogleSignIn, navigation
}) {
    return (
        <View>
            <TextInput
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                placeholderTextColor="#aaa"
                onFocus={() => setShowDatePicker(false)}
            />
            <TextInput
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
                style={styles.input}
                placeholderTextColor="#aaa"
                onFocus={() => setShowDatePicker(false)}
            />
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholderTextColor="#aaa"
                onFocus={() => setShowDatePicker(false)}
            />

            <View style={[
                styles.passwordContainer,
                { borderBottomColor: passwordInfo.color, borderBottomWidth: 2.5 },
            ]}>
                <TextInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={styles.passwordInput}
                    placeholderTextColor="#aaa"
                    onFocus={() => setShowDatePicker(false)}
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
            
            {passwordInfo.label ? (
                <Text style={[styles.strengthText, { color: passwordInfo.color }]}>
                    {passwordInfo.label}
                </Text>
            ) : null}

            <TouchableOpacity style={styles.primaryButton} onPress={handleStep1Next}>
                <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>

            <Text style={styles.divider}>──────── OR ────────</Text>

            <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
                activeOpacity={0.7}
            >
                <Image
                    source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                    style={styles.googleIconImage}
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.loginFooter}>
                <Text style={{ color: theme.textSecondary }}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginLink}>Log In</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
