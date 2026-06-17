import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    useColorScheme,
    Platform,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Iconify } from 'react-native-iconify';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@readme/shared/src/constants/theme';
import { doUpdateUserProfile } from '@readme/shared/src/services/auth';
import { auth } from '@readme/shared/src/services/firebase';

// ─── Country Picker (lightweight inline dropdown) ─────────────────────────────
// If you already have a country-picker library feel free to swap this out.
import CountryPicker from 'react-native-country-picker-modal';
import {buildStyles} from "../../../styles/editProfileStyles";

export default function EditProfileScreen({ navigation, route }) {
    // route.params can carry the current user data when navigating here
    const existing = route?.params?.userData ?? {};

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme);

    // ─── Form state ───────────────────────────────────────────────────────────
    const [fullName, setFullName]           = useState(existing.fullName ?? '');
    const [username, setUsername]           = useState(existing.username ?? '');
    const [phoneNumber, setPhoneNumber]     = useState(existing.phoneNumber ?? '');
    const [country, setCountry]             = useState(existing.institutionalAddress?.country ?? '');
    const [countryCode, setCountryCode]     = useState('PT');
    const [city, setCity]                   = useState(existing.institutionalAddress?.city ?? '');
    const [district, setDistrict]           = useState(existing.institutionalAddress?.district ?? '');
    const [addressLine1, setAddressLine1]   = useState(existing.institutionalAddress?.addressLine1 ?? '');
    const [addressLine2, setAddressLine2]   = useState(existing.institutionalAddress?.addressLine2 ?? '');
    const [postalCode, setPostalCode]       = useState(existing.institutionalAddress?.postalCode ?? '');

    // Date of birth
    const parseDob = (dobStr) => {
        if (!dobStr) return new Date(2000, 0, 1);
        const [d, m, y] = dobStr.split('/');
        return new Date(Number(y), Number(m) - 1, Number(d));
    };
    const [date, setDate]                   = useState(parseDob(existing.dob));
    const [dob, setDob]                     = useState(existing.dob ?? '');
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Country picker visibility
    const [showCountryPicker, setShowCountryPicker] = useState(false);

    const [isSaving, setIsSaving] = useState(false);

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const handleDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate) {
            setDate(selectedDate);
            const d = String(selectedDate.getDate()).padStart(2, '0');
            const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const y = selectedDate.getFullYear();
            setDob(`${d}/${m}/${y}`);
        }
    };

    const handleCountrySelect = (c) => {
        setCountryCode(c.cca2);
        setCountry(c.name);
        setShowCountryPicker(false);
    };

    const handleSave = async () => {
        if (!fullName || !username || !phoneNumber || !dob || !country || !city || !district || !addressLine1 || !postalCode) {
            Alert.alert('Missing fields', 'Please fill in all required fields.');
            return;
        }
        setIsSaving(true);
        try {
            const uid = auth.currentUser?.uid;
            if (!uid) throw new Error('Not authenticated.');

            await doUpdateUserProfile(uid, {
                fullName,
                username,
                phoneNumber,
                dob,
                institutionalAddress: {
                    addressLine1,
                    addressLine2: addressLine2 || null,
                    city,
                    district,
                    postalCode,
                    country,
                },
            });

            Alert.alert('Saved', 'Your profile has been updated.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <View style={[styles.root, { backgroundColor: theme.background }]}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
                    <Iconify icon="lucide:arrow-left" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit profile</Text>
                {/* spacer to centre the title */}
                <View style={{ width: 22 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* ── Full Name ── */}
                <Field label="Full Name" active>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Full Name"
                        placeholderTextColor={theme.subtext}
                    />
                </Field>

                {/* ── Date of Birth ── */}
                <Field label="Date of birth" active>
                    <TouchableOpacity
                        style={styles.rowBetween}
                        onPress={() => setShowDatePicker(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.input, { color: dob ? theme.text : theme.subtext, flex: 1 }]}>
                            {dob || 'DD/MM/YYYY'}
                        </Text>
                        <Iconify icon="lucide:calendar" size={20} color={theme.subtext} />
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
                </Field>

                {/* ── Username ── */}
                <Field label="Username">
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="username"
                        placeholderTextColor={theme.subtext}
                        autoCapitalize="none"
                    />
                </Field>

                {/* ── Phone Number ── */}
                <Field label="Phone number">
                    <View style={styles.rowStart}>
                        <TouchableOpacity
                            onPress={() => setShowCountryPicker(true)}
                            style={styles.flagBtn}
                            activeOpacity={0.7}
                        >
                            <CountryPicker
                                countryCode={countryCode}
                                withFlag
                                withFilter={false}
                                withCallingCode={false}
                                withEmoji
                                onSelect={handleCountrySelect}
                                visible={showCountryPicker}
                                onClose={() => setShowCountryPicker(false)}
                                renderFlagButton={({ onOpen }) => (
                                    <TouchableOpacity onPress={onOpen} activeOpacity={0.7}>
                                        <CountryPicker
                                            countryCode={countryCode}
                                            withFlag
                                            withEmoji
                                            withCallingCode={false}
                                            withFilter={false}
                                            onSelect={handleCountrySelect}
                                            visible={false}
                                        />
                                    </TouchableOpacity>
                                )}
                            />
                        </TouchableOpacity>
                        <TextInput
                            style={[styles.input, { flex: 1, color: theme.text }]}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            placeholder="000 000 000"
                            placeholderTextColor={theme.subtext}
                            keyboardType="phone-pad"
                        />
                    </View>
                </Field>

                {/* ── Country ── */}
                <Field label="Country">
                    <TouchableOpacity
                        style={styles.rowBetween}
                        onPress={() => setShowCountryPicker(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.input, { color: country ? theme.text : theme.subtext, flex: 1 }]}>
                            {country || 'Select country'}
                        </Text>
                        <Iconify icon="lucide:chevron-down" size={18} color={theme.subtext} />
                    </TouchableOpacity>
                    {/* Hidden picker triggered above */}
                    <CountryPicker
                        countryCode={countryCode}
                        withFlag
                        withFilter
                        withEmoji
                        withCallingCode={false}
                        onSelect={handleCountrySelect}
                        visible={showCountryPicker}
                        onClose={() => setShowCountryPicker(false)}
                        renderFlagButton={() => null}
                    />
                </Field>

                {/* ── City ── */}
                <Field label="City">
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={city}
                        onChangeText={setCity}
                        placeholder="City"
                        placeholderTextColor={theme.subtext}
                    />
                </Field>

                {/* ── District ── */}
                <Field label="District">
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={district}
                        onChangeText={setDistrict}
                        placeholder="District"
                        placeholderTextColor={theme.subtext}
                    />
                </Field>

                {/* ── Address Line 1 ── */}
                <Field label="Address Line 1" active>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={addressLine1}
                        onChangeText={setAddressLine1}
                        placeholder="Street address"
                        placeholderTextColor={theme.subtext}
                    />
                </Field>

                {/* ── Address Line 2 ── */}
                <Field label="Address Line 2">
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={addressLine2}
                        onChangeText={setAddressLine2}
                        placeholder="Apartment, suite, etc. (optional)"
                        placeholderTextColor={theme.subtext}
                    />
                </Field>

                {/* ── Postal Code ── */}
                <Field label="Postal Code">
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={postalCode}
                        onChangeText={setPostalCode}
                        placeholder="0000-000"
                        placeholderTextColor={theme.subtext}
                        keyboardType="numbers-and-punctuation"
                    />
                </Field>

                {/* ── Submit ── */}
                <TouchableOpacity
                    style={[styles.submitBtn, isSaving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={isSaving}
                    activeOpacity={0.85}
                >
                    {isSaving
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.submitText}>SAVE CHANGES</Text>
                    }
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, children, active = false }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme);

    return (
        <View style={[styles.field, active && styles.fieldActive]}>
            <Text style={[styles.fieldLabel, active && styles.fieldLabelActive]}>
                {label}
            </Text>
            {children}
        </View>
    );
}

