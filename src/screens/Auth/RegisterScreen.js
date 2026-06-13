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
    doSignInWithGoogleCredential ,
    doSignOut,
} from '../../services/auth';
import { Colors, Spacing, Fonts } from '../../constants/theme';

export default function RegisterScreen({ navigation }) {
    const [step, setStep] = useState(1);

    const [isGoogleUser, setIsGoogleUser] = useState(false);
    const [googleIdToken, setGoogleIdToken] = useState(null);

    const [showPassword, setShowPassword] = useState(false);

    // Step 1: Personal Data
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState(''); 
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [dob, setDob] = useState('');
    const [isPublic, setIsPublic] = useState(true);

    // Date Picker States
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Step 2: Address
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

    const getPasswordDetails = () => {
        if (password.length === 0) return { level: 'none', color: '#ccc', label: '' };
        if (password.length < 6) return { level: 'weak', color: '#D32F2F', label: 'Weak' };

        const hasNumbers = /\d/.test(password);
        const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);

        if (password.length >= 10 && hasNumbers && hasMixedCase) {
            return { level: 'strong', color: '#388E3C', label: 'Strong' };
        }
        return { level: 'medium', color: '#F57C00', label: 'Medium' };
    };

    const passwordInfo = getPasswordDetails();

    const handleNextStep = () => {
        if (!username || !email.trim() || !password || !fullName || !phoneNumber || !dob) {
            Alert.alert("Error", "Please fill in all required fields.");
            return;
        }
        if (passwordInfo.level === 'weak' || passwordInfo.level === 'none') {
            const missing = [];
            if (password.length < 6) missing.push("at least 6 characters");
            if (!/\d/.test(password)) missing.push("a number");
            if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) missing.push("uppercase and lowercase letters");

            Alert.alert(
                "Weak Password",
                `Your password needs:\n\n• ${missing.join('\n• ')}`
            );
            return;
        }
        setStep(2);
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
            const errorMessage = error.message?.toLowerCase() || '';
            if (errorMessage.includes('cancel') || errorMessage.includes('dismiss')) return;

            console.error("GOOGLE SIGN IN ERROR:", error);
            Alert.alert("Google Error", error.message);
        }
    };

    const handleRegister = async () => {
        if (!addressLine1 || !city || !district || !zipCode || !country) {
            Alert.alert("Error", "Please fill in all institutional address fields.");
            return;
        }

        setIsRegistering(true);

        const profileData = {
            username, fullName, phoneNumber, dob, isPublic, email,
            addressLine1, addressLine2, city, district, zipCode, country
        };

        try {
            if (isGoogleUser) {
                if (!googleIdToken) throw new Error("Missing Google Token.");
                await doSignInWithGoogleCredential(googleIdToken, profileData);
                setIsRegistering(false);
                Alert.alert("Success", "Account created successfully!", [
                    { text: "OK", onPress: () => navigation.navigate('Home') }
                ]);
            } else {
                await doCreateUserWithEmailAndPassword(email.trim(), password, profileData);
                await doSignOut();
                Alert.alert(
                    "Verify your Email", 
                    "Account created! We've sent a verification link to your email. Please verify it before logging in.", 
                    [
                        { text: "OK", onPress: () => navigation.navigate('Login') }
                    ]
                );
            }
        } catch (error) {
            setIsRegistering(false);
            Alert.alert("Registration Failed", error.message);
        }
    };

    const handleDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setDate(selectedDate);
            // Format to DD/MM/YYYY
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const year = selectedDate.getFullYear();
            setDob(`${day}/${month}/${year}`);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            onScroll={() => setShowDatePicker(false)} 
            scrollEventThrottle={16}
        >
            <View style={styles.container}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.stepIndicator}>Step {step} of 2</Text>

                {step === 1 ? (
                    <View>
                        <TextInput placeholder="Username"
                            value={username}
                            onChangeText={setUsername}
                            style={styles.input}
                            placeholderTextColor="#aaa"
                            onFocus={() => setShowDatePicker(false)}
                        />
                        <TextInput placeholder="Full Name"
                            value={fullName}
                            onChangeText={setFullName}
                            style={styles.input}
                            placeholderTextColor="#aaa"
                            onFocus={() => setShowDatePicker(false)}
                        />
                        <TextInput placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            style={styles.input}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="email-address"
                            placeholderTextColor="#aaa"
                            onFocus={() => setShowDatePicker(false)}
                        />
                        <TextInput placeholder="Phone Number"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                            style={styles.input}
                            placeholderTextColor="#aaa"
                            onFocus={() => setShowDatePicker(false)}
                        />
                        
                        {/* Interactive Date Picker Input */}
                        <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                            <View pointerEvents="none">
                                <TextInput 
                                    placeholder="Date of Birth (DD/MM/YYYY)"
                                    value={dob}
                                    style={styles.input}
                                    placeholderTextColor="#aaa"
                                    editable={false} // Prevents manual typing
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

                        <View style={[
                            styles.passwordContainer, 
                            { borderBottomColor: passwordInfo.color, borderBottomWidth: 2.5 }
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
                                <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
                            </TouchableOpacity>
                        </View>

                        { passwordInfo.label ? (
                            <Text style={[styles.strengthText, { color: passwordInfo.color }]}>{passwordInfo.label}</Text>
                        ) : null}

                        <View style={styles.switchContainer}>
                            <Text style={[styles.switchLabel, { color: theme.text }]}>
                                Public Profile: <Text style={{ fontWeight: 'bold' }}>{isPublic ? "Yes" : "No"}</Text>
                            </Text>
                            <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: '#208AEF', false: '#ccc' }} />
                        </View>

                        <TouchableOpacity style={styles.primaryButton} onPress={handleNextStep}>
                            <Text style={styles.buttonText}>Continue</Text>
                        </TouchableOpacity>

                        <Text style={styles.divider}>──────── OR ────────</Text>

                        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn} activeOpacity={0.7}>
                            <Image source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }} style={styles.googleIconImage} />
                            <Text style={styles.googleButtonText}>Continue with Google</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                        <View>
                            <Text style={styles.sectionTitle}>Institutional Address</Text>

                            <TextInput placeholder="Address Line 1"
                                value={addressLine1}
                                onChangeText={setAddressLine1}
                                style={styles.input} placeholderTextColor="#aaa"
                            />
                            <TextInput placeholder="Address Line 2 (Optional)"
                                value={addressLine2}
                                onChangeText={setAddressLine2}
                                style={styles.input}
                                placeholderTextColor="#aaa"
                            />
                            <TextInput placeholder="City" value={city}
                                onChangeText={setCity}
                                style={styles.input}
                                placeholderTextColor="#aaa"
                            />
                            <TextInput placeholder="District"
                                value={district}
                                onChangeText={setDistrict}
                                style={styles.input}
                                placeholderTextColor="#aaa"
                            />
                            <TextInput placeholder="Postal / ZIP Code"
                                value={zipCode}
                                onChangeText={setZipCode}
                                style={styles.input}
                                placeholderTextColor="#aaa"
                            />
                            <TextInput placeholder="Country"
                                value={country}
                                onChangeText={setCountry}
                                style={styles.input}
                                placeholderTextColor="#aaa"
                            />

                            <View style={styles.rowButtons}>
                                <TouchableOpacity style={[styles.primaryButton, styles.backButton]} onPress={() => setStep(1)}>
                                    <Text style={[styles.buttonText, { color: '#208AEF' }]}>Back</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.primaryButton, styles.flexButton]} onPress={handleRegister} disabled={isRegistering}>
                                    <Text style={styles.buttonText}>{isRegistering ? "Processing..." : "Finish"}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                <View style={styles.loginFooter}>
                    <Text style={{ color: theme.textSecondary }}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLink}>Log In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const buildStyles = (theme) => StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center'
    },
    container: {
        flex: 1,
        padding: Spacing.four,
        justifyContent: 'center',
        backgroundColor: theme.background
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: Fonts.sans,
        color: theme.text,
        marginTop: 10
    },
    stepIndicator: {
        textAlign: 'center',
        color: '#aaa',
        fontSize: 14,
        marginBottom: 15,
        fontWeight: '600'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 10
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        marginVertical: 8,
        borderRadius: 8,
        backgroundColor: '#fafafa',
        fontSize: 15
    },
    strengthText: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 10,
        marginLeft: 4
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 12,
        paddingHorizontal: 4
    },
    switchLabel: {
        fontSize: 15
    },
    primaryButton: {
        backgroundColor: '#208AEF',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
    divider: {
        textAlign: 'center',
        color: '#aaa',
        marginVertical: 18,
        fontSize: 12
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
        marginBottom: 5
    },
    googleIconImage: {
        width: 22,
        height: 22,
        marginRight: 12
    },
    googleButtonText: {
        color: '#1F2937',
        fontWeight: '600',
        fontSize: 16
    },
    rowButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10
    },
    backButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#208AEF',
        flex: 1
    },
    flexButton: {
        flex: 1
    },
    loginFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 25,
        marginBottom: 15
    },
    loginLink: {
        color: '#208AEF',
        fontWeight: 'bold',
        fontSize: 15
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
        color: '#208AEF',
        fontWeight: '600',
        fontSize: 14,
    },
});
