// ─── Imports ───────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
    View,
    TextInput,
    StyleSheet,
    Text,
    Alert,
    TouchableOpacity,
    Image,
    ScrollView,
    Switch,
    useColorScheme,
    Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    doCreateUserWithEmailAndPassword,
    doGetGoogleTokenAndProfile,
    doSignInWithGoogleCredential,
    doSignOut,
} from '../../services/auth';
import { Colors, Spacing, Fonts } from '../../constants/theme';
import { EyeIcon, EyeClosedIcon } from 'phosphor-react-native';

// ─── Step Progress Dots ───────────────────────────────────────────────────────
function StepDots({ currentStep, totalSteps, theme }) {
    const styles = buildStyles(theme);
    return (
        <View style={styles.dotsContainer}>
            {Array.from({ length: totalSteps }).map((_, i) => (
                <View
                    key={i}
                    style={[
                        styles.dot,
                        currentStep === i + 1 ? styles.dotActive : styles.dotInactive,
                    ]}
                />
            ))}
        </View>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation }) {
    const [step, setStep] = useState(1);

    const [isGoogleUser, setIsGoogleUser] = useState(false);
    const [googleIdToken, setGoogleIdToken] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    // Step 1: Credentials
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    // Step 2: Personal details
    const [phoneNumber, setPhoneNumber] = useState('');
    const [dob, setDob] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Step 3: Address
    const [addressLine1, setAddressLine1] = useState('');
    const [addressLine2, setAddressLine2] = useState('');
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [country, setCountry] = useState('');

    const [isRegistering, setIsRegistering] = useState(false);

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme);

    // ─── Password strength ────────────────────────────────────────────────────

    const getPasswordDetails = () => {
        if (password.length === 0) return { level: 'none', color: '#ccc', label: '' };
        if (password.length < 6) return { level: 'weak', color: '#D32F2F', label: 'Weak' };
        const hasNumbers = /\d/.test(password);
        const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
        if (password.length >= 10 && hasNumbers && hasMixedCase)
            return { level: 'strong', color: '#388E3C', label: 'Strong' };
        return { level: 'medium', color: '#F57C00', label: 'Medium' };
    };

    const passwordInfo = getPasswordDetails();

    // ─── Step handlers ────────────────────────────────────────────────────────

    const handleStep1Next = () => {
        if (!username || !email.trim() || !password || !fullName) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }
        if (passwordInfo.level === 'weak' || passwordInfo.level === 'none') {
            const missing = [];
            if (password.length < 6) missing.push('at least 6 characters');
            if (!/\d/.test(password)) missing.push('a number');
            if (!/[a-z]/.test(password) || !/[A-Z]/.test(password))
                missing.push('uppercase and lowercase letters');
            Alert.alert('Weak Password', `Your password needs:\n\n• ${missing.join('\n• ')}`);
            return;
        }
        setStep(2);
    };

    const handleStep2Next = () => {
        if (!phoneNumber || !dob) {
            Alert.alert('Error', 'Please fill in your phone number and date of birth.');
            return;
        }
        setStep(3);
    };

    const handleGoogleSignIn = async () => {
        try {
            const result = await doGetGoogleTokenAndProfile();
            setGoogleIdToken(result.idToken);
            setEmail(result.profile.email);
            setFullName(result.profile.fullName);
            setUsername(result.profile.username);
            setIsGoogleUser(true);
            setStep(2);
        } catch (error) {
            const msg = error.message?.toLowerCase() || '';
            if (msg.includes('cancel') || msg.includes('dismiss')) return;
            console.error('GOOGLE SIGN IN ERROR:', error);
            Alert.alert('Google Error', error.message);
        }
    };

    const handleRegister = async () => {
        if (!addressLine1 || !city || !district || !zipCode || !country) {
            Alert.alert('Error', 'Please fill in all address fields.');
            return;
        }
        setIsRegistering(true);

        const profileData = {
            username, fullName, phoneNumber, dob, isPublic, email,
            addressLine1, addressLine2, city, district, zipCode, country,
        };

        try {
            if (isGoogleUser) {
                if (!googleIdToken) throw new Error('Missing Google Token.');
                await doSignInWithGoogleCredential(googleIdToken, profileData);
                setIsRegistering(false);
                Alert.alert('Success', 'Account created successfully!', [
                    { text: 'OK', onPress: () => navigation.navigate('Home') },
                ]);
            } else {
                await doCreateUserWithEmailAndPassword(email.trim(), password, profileData);
                await doSignOut();
                Alert.alert(
                    'Verify your Email',
                    "Account created! We've sent a verification link to your email. Please verify it before logging in.",
                    [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
                );
            }
        } catch (error) {
            setIsRegistering(false);
            Alert.alert('Registration Failed', error.message);
        }
    };

    const handleDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate) {
            setDate(selectedDate);
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const year = selectedDate.getFullYear();
            setDob(`${day}/${month}/${year}`);
        }
    };

    // Google users see 2 steps (they skip step 1), email users see 3
    const totalSteps = isGoogleUser ? 2 : 3;
    const displayStep = isGoogleUser ? step - 1 : step;

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            onScroll={() => setShowDatePicker(false)}
            scrollEventThrottle={16}
        >
            {/* ── Header — always visible ── */}
            <View style={styles.header}>
                <Text style={styles.eyebrow}>Join The Swap</Text>
                <Text style={styles.title}>Create your account{'\n'}to start swapping books</Text>
                <StepDots currentStep={displayStep} totalSteps={totalSteps} theme={theme} />
            </View>

            <View style={styles.body}>

                {/* ── STEP 1: Credentials ── */}
                {step === 1 && (
                    <View>
                        {/* 👉 Image above: <Image source={...} style={styles.stepImage} resizeMode="contain" /> */}

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

                        {/* 👉 Image below: <Image source={...} style={styles.stepImage} resizeMode="contain" /> */}

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
                )}

                {/* ── STEP 2: Personal details ── */}
                {step === 2 && (
                    <View>
                        {/* 👉 Image above: <Image source={...} style={styles.stepImage} resizeMode="contain" /> */}
                        <Image
                            source={require('../../../assets/images/WormLookingDownBook.png')}
                            style={styles.step2Image}
                            resizeMode="contain"
                        />

                        <TextInput
                            placeholder="Phone Number"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                            style={styles.input}
                            placeholderTextColor="#aaa"
                            onFocus={() => setShowDatePicker(false)}
                        />

                        <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                            <View pointerEvents="none">
                                <TextInput
                                    placeholder="Date of Birth (DD/MM/YYYY)"
                                    value={dob}
                                    style={styles.input}
                                    placeholderTextColor="#aaa"
                                    editable={false}
                                />
                            </View>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleDateChange}
                                maximumDate={new Date()}
                            />
                        )}

                        <View style={styles.switchContainer}>
                            <Text style={[styles.switchLabel, { color: theme.text }]}>
                                Profile Visibility:{' '}
                                <Text style={{ fontWeight: 'bold' }}>{isPublic ? 'Public' : 'Private'}</Text>
                            </Text>
                            <Switch
                                value={isPublic}
                                onValueChange={setIsPublic}
                                trackColor={{ true: theme.tertiaryVivid, false: '#ccc' }}
                            />
                        </View>

                        {/* 👉 Image below: <Image source={...} style={styles.stepImage} resizeMode="contain" /> */}

                        <View style={styles.rowButtons}>
                            {isGoogleUser ? (
                                <TouchableOpacity
                                    style={[styles.primaryButton, styles.backButton]}
                                    onPress={() => navigation.navigate('Login')}
                                >
                                    <Text style={[styles.buttonText, { color: '#208AEF' }]}>Cancel</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.primaryButton, styles.backButton]}
                                    onPress={() => setStep(1)}
                                >
                                    <Text style={[styles.buttonText, { color: theme.primary }]}>Back</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.primaryButton, styles.flexButton]}
                                onPress={handleStep2Next}
                            >
                                <Text style={styles.buttonText}>Continue</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* ── STEP 3: Address ── */}
                {step === 3 && (
                    <View>
                        {/* 👉 Image above: <Image source={...} style={styles.stepImage} resizeMode="contain" /> */}

                        <Text style={styles.sectionTitle}>Where to?</Text>
                        <Text style={styles.sectionSubtitle}>Tell us where to send your books</Text>

                        <TextInput
                            placeholder="Address Line 1"
                            value={addressLine1}
                            onChangeText={setAddressLine1}
                            style={styles.input}
                            placeholderTextColor="#aaa"
                        />
                        <TextInput
                            placeholder="Address Line 2 (Optional)"
                            value={addressLine2}
                            onChangeText={setAddressLine2}
                            style={styles.input}
                            placeholderTextColor="#aaa"
                        />
                        <TextInput
                            placeholder="City"
                            value={city}
                            onChangeText={setCity}
                            style={styles.input}
                            placeholderTextColor="#aaa"
                        />
                        <TextInput
                            placeholder="District"
                            value={district}
                            onChangeText={setDistrict}
                            style={styles.input}
                            placeholderTextColor="#aaa"
                        />
                        <TextInput
                            placeholder="Postal / ZIP Code"
                            value={zipCode}
                            onChangeText={setZipCode}
                            style={styles.input}
                            placeholderTextColor="#aaa"
                        />
                        <TextInput
                            placeholder="Country"
                            value={country}
                            onChangeText={setCountry}
                            style={styles.input}
                            placeholderTextColor="#aaa"
                        />

                        {/* 👉 Image below: <Image source={...} style={styles.stepImage} resizeMode="contain" /> */}

                        <Image
                            source={require('../../../assets/images/WormLayed.png')}
                            style={styles.step3Image}
                            resizeMode="contain"
                        />


                        <View style={styles.rowButtons}>
                            <TouchableOpacity
                                style={[styles.primaryButton, styles.backButton]}
                                onPress={() => setStep(2)}
                            >
                                <Text style={[styles.buttonText, { color: theme.primary }]}>Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.primaryButton, styles.flexButton]}
                                onPress={handleRegister}
                                disabled={isRegistering}
                            >
                                <Text style={styles.buttonText}>
                                    {isRegistering ? 'Processing...' : 'Finish'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

            </View>
        </ScrollView>
    );
}

const buildStyles = (theme) => StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        backgroundColor: theme.background,
        marginTop: 5
    },

    // ── Header ──
    header: {
        paddingHorizontal: Spacing.four,
        paddingTop: 70,
        paddingBottom: 8,
    },
    eyebrow: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.secondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        fontFamily: Fonts.sans,
        color: theme.text,
        lineHeight: 34,
    },

    // ── Body ──
    body: {
        flex: 1,
        padding: Spacing.four,
        marginTop: -20,
    },

    // ── Step image placeholder ──
    step2Image: {
        width: '100%',
        height: 220,
        marginVertical: 16,
        borderRadius: 12,
        marginTop: -30,
        marginBottom: -2,
    },
    step3Image: {
        width: '100%',
        height: 100,
        marginVertical: 16,
        borderRadius: 12,
        marginTop: -15,
        marginBottom: 0,
    },

    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#888',
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        marginVertical: 8,
        borderRadius: 8,
        backgroundColor: '#fafafa',
        fontSize: 15,
    },
    strengthText: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 10,
        marginLeft: 4,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 12,
        paddingHorizontal: 4,
    },
    switchLabel: {
        fontSize: 15,
    },
    primaryButton: {
        backgroundColor: theme.primary,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    divider: {
        textAlign: 'center',
        color: '#aaa',
        marginVertical: 18,
        fontSize: 12,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingVertical: 14,
        borderRadius: 100,
        marginBottom: 5,
    },
    googleIconImage: {
        width: 22,
        height: 22,
        marginRight: 12,
    },
    googleButtonText: {
        color: '#1F2937',
        fontWeight: '600',
        fontSize: 16,
    },
    rowButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    backButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.primary,
        flex: 1,
    },
    flexButton: {
        flex: 1,
    },
    loginFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 25,
        marginBottom: 15,
    },
    loginLink: {
        color: theme.primary,
        fontWeight: 'bold',
        fontSize: 15,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        backgroundColor: '#fafafa',
        marginVertical: 8,
    },
    passwordInput: {
        flex: 1,
        padding: 12,
        fontSize: 15,
        color: theme.text,
    },
    eyeButton: {
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'stretch',
    },
    eyeText: {
        color: theme.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        paddingTop: 20,
        paddingBottom: 4,
    },
    dot: {
        height: 6,
        width: 40,
        borderRadius: 999,
    },
    dotActive: {
        backgroundColor: theme.tertiary,
    },
    dotInactive: {
        backgroundColor: theme.tertiaryInactive,
    },
});
