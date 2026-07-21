import React, { useState, useCallback } from 'react';
import { buildPasswordStyles } from '../../../styles/passwordStyles';
import { useFocusEffect } from '@react-navigation/native';
import { 
    View,
    Text,
    Alert,
    ScrollView,
    Platform
} from 'react-native';

import { isValidEmail } from '@readme/shared/src/utils/registerUtils';

import { dateToIso } from '@readme/shared/src/utils/dateUtils';

import {
    doCreateUserWithEmailAndPassword,
    doGetGoogleTokenAndProfile,
    doSignInWithGoogleCredential,
    doCompleteGoogleRegistration,
    doSignOut,
} from '@readme/shared/src/services/auth';

import { ROUTES } from '@readme/shared/src/constants/routes';
import { useTheme } from '@readme/shared/src/hooks/use-theme';

// Separated Components
import { buildAuthStyles } from '../../../styles/authStyles';
import {
    getPasswordDetails,
    hasMixedCase,
    hasNumbers,
    hasValidLength,
    calculateAge
} from '@readme/shared/src/utils/registerUtils';
import StepDots from './Components/StepDots';
import StepOneCredentials from './StepOneCredentials';
import StepTwoPersonal from './StepTwoPersonal';
import StepThreeAddress from './StepThreeAddress';

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

    const theme = useTheme();
    const styles = buildAuthStyles(theme);
    const passwordStyles = buildPasswordStyles(theme);

    const passwordInfo = getPasswordDetails(password);

    // ─── State Reset Logic ────────────────────────────────────────────────────
    
    const resetForm = useCallback(() => {
        setStep(1);
        setIsGoogleUser(false);
        setGoogleIdToken(null);
        setShowPassword(false);

        setUsername('');
        setEmail('');
        setPassword('');
        setFullName('');

        setPhoneNumber('');
        setDob('');
        setIsPublic(true);
        setDate(new Date());
        setShowDatePicker(false);

        setAddressLine1('');
        setAddressLine2('');
        setCity('');
        setDistrict('');
        setZipCode('');
        setCountry('');

        setIsRegistering(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            return () => {
                resetForm();
            };
        }, [resetForm])
    );

    // ─── Step handlers ────────────────────────────────────────────────────────

    const handleStep1Next = () => {
        if (!username || !email.trim() || !password || !fullName) {
            Alert.alert('Missing Fields', 'Please fill in all required fields.');
            return;
        }

        if (!isValidEmail(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        if (passwordInfo.level !== 'strong') {
            const missing = [];
            if (!hasValidLength(password)) {
                missing.push('At least 6 characters');
            }
            if (!hasNumbers(password)) {
                missing.push('At least one number');
            }
            if (!hasMixedCase(password)) {
                missing.push('uppercase and lowercase letters');
            }

            Alert.alert('Weak Password', `Your password needs:\n• ${missing.join('\n• ')}`);
            return;
        }

        setStep(2);
    };

    const handleStep2Next = () => {
        if (!dob) {
            Alert.alert('Missing Fields', 'Please fill in your date of birth.');
            return;
        }

        if (calculateAge(date) < 16) {
            Alert.alert('Age Requirement', 'You must be at least 16 years old to create an account.');
            return;
        }

        setStep(3);
    };

    // ─── SMART GOOGLE SIGN-IN & REGISTRATION ──────────────────────────────────
    const handleGoogleSignIn = async () => {
        try {
            // 1. Fetch Google ID token and profile
            const result = await doGetGoogleTokenAndProfile();
            if (!result?.idToken) return;

            // 2. Attempt sign-in. doSignInWithGoogleCredential throws 'auth/user-not-found'
            //    if no Firestore profile exists for this Google account.
            try {
                await doSignInWithGoogleCredential(result.idToken, result.profile);
                Alert.alert(
                    'Welcome Back',
                    'An account already exists with this Google email. Logging you in!',
                    [{ text: 'OK', onPress: () => navigation.navigate(ROUTES.MAIN) }]
                );
                return;
            } catch (signInError) {
                if (signInError.code !== 'auth/user-not-found') {
                    throw signInError;
                }
                // No profile exists yet — fall through to registration flow below.
            }

            // 3. NEW USER: save their info and advance them to Step 2.
            setGoogleIdToken(result.idToken);
            setEmail(result.profile?.email || '');
            setFullName(result.profile?.fullName || result.profile?.name || '');
            setUsername(result.profile?.username || result.profile?.email?.split('@')[0] || '');
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

                await doCompleteGoogleRegistration(googleIdToken, profileData);

                setIsRegistering(false);
                Alert.alert('Success', 'Account created successfully!', [
                    { text: 'OK', onPress: () => navigation.navigate(ROUTES.MAIN) },
                ]);
            } else {
                // Standard Email/Password flow
                await doCreateUserWithEmailAndPassword(email.trim(), password, profileData);
                await doSignOut();
                Alert.alert(
                    'Verify your Email',
                    "Account created! We've sent a verification link to your email. Please verify it before logging in.",
                    [{ text: 'OK', onPress: () => navigation.navigate(ROUTES.LOGIN) }]
                );
            }
        } catch (error) {
            setIsRegistering(false);
            if (error.code === "auth/email-already-in-use" || error.message === "Firebase: Error (auth/email-already-in-use).") {
                Alert.alert('Registration Failed', "Email already in use.");
            } else {
                Alert.alert('Registration Failed', error.message);
            }
        }
    };

    const handleDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate) {
            setDate(selectedDate);
            setDob(dateToIso(selectedDate));
        }
    };

    const totalSteps = isGoogleUser ? 2 : 3;
    const displayStep = isGoogleUser ? step - 1 : step;

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <ScrollView
            style={{ backgroundColor: theme.background || '#fff' }}
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            onScroll={() => setShowDatePicker(false)}
            scrollEventThrottle={16}
        >
            <View style={styles.header}>
                <Text style={styles.eyebrow}>Join The Swap</Text>
                <Text style={styles.title}>Create your account{'\n'}to start swapping books</Text>
                <StepDots currentStep={displayStep} totalSteps={totalSteps} styles={styles} />
            </View>

            <View style={styles.body}>
                {step === 1 && (
                    <StepOneCredentials
                        username={username} setUsername={setUsername}
                        fullName={fullName} setFullName={setFullName}
                        email={email} setEmail={setEmail}
                        password={password} setPassword={setPassword}
                        showPassword={showPassword} setShowPassword={setShowPassword}
                        passwordInfo={passwordInfo} setShowDatePicker={setShowDatePicker}
                        styles={styles} 
                        passwordStyles={passwordStyles}
                        theme={theme}
                        handleStep1Next={handleStep1Next}
                        handleGoogleSignIn={handleGoogleSignIn}
                        navigation={navigation}
                    />
                )}

                {step === 2 && (
                    <StepTwoPersonal
                        phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber}
                        dob={dob} date={date}
                        showDatePicker={showDatePicker} setShowDatePicker={setShowDatePicker}
                        handleDateChange={handleDateChange}
                        isPublic={isPublic} setIsPublic={setIsPublic}
                        isGoogleUser={isGoogleUser} setStep={setStep}
                        handleStep2Next={handleStep2Next} navigation={navigation}
                        styles={styles} theme={theme}
                    />
                )}

                {step === 3 && (
                    <StepThreeAddress
                        addressLine1={addressLine1} setAddressLine1={setAddressLine1}
                        addressLine2={addressLine2} setAddressLine2={setAddressLine2}
                        city={city} setCity={setCity}
                        district={district} setDistrict={setDistrict}
                        zipCode={zipCode} setZipCode={setZipCode}
                        country={country} setCountry={setCountry}
                        isRegistering={isRegistering} handleRegister={handleRegister}
                        setStep={setStep} styles={styles} theme={theme}
                    />
                )}
            </View>
        </ScrollView>
    );
}
