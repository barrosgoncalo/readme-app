import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
    View,
    Text,
    Alert,
    ScrollView,
    useColorScheme,
    Platform
} from 'react-native';

import {
    doCreateUserWithEmailAndPassword,
    doGetGoogleTokenAndProfile,
    doSignInWithGoogleCredential,
    doSignOut,
} from '@readme/shared/src/services/auth';

import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';

// Separated Components
import { buildStyles } from '../../../styles/authStyles';
import { getPasswordDetails } from '@readme/shared/src/utils/registerUtils';
import StepDots from './StepDots';
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

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme);

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
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }
        if (passwordInfo.level === 'weak' || passwordInfo.level === 'none') {
            const missing = [];
            if (password.length < 6) missing.push('at least 6 characters');
            if (!/\d/.test(password)) missing.push('a number');
            if (!/[a-z]/.test(password) && !/[A-Z]/.test(password)) missing.push('uppercase and lowercase letters');
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
                    { text: 'OK', onPress: () => navigation.navigate(ROUTES.MAIN) },
                ]);
            } else {
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
                        styles={styles} theme={theme}
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
