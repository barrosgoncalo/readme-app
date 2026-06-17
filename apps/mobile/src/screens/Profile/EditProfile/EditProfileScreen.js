import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    useColorScheme,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Iconify } from 'react-native-iconify';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@readme/shared/src/constants/theme';
import { doUpdateUserProfile } from '@readme/shared/src/services/auth';
import { auth } from '@readme/shared/src/services/firebase';
import CountryPicker from 'react-native-country-picker-modal';
import { buildStyles } from '../../../styles/editProfileStyles';

export default function EditProfileScreen({ navigation, route }) {
    const existing = route?.params?.userData ?? {};

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme);

    // ─── Form state ───────────────────────────────────────────────────────────
    const [fullName, setFullName]         = useState(existing.fullName ?? '');
    const [username, setUsername]         = useState(existing.username ?? '');
    const [phoneNumber, setPhoneNumber]   = useState(existing.phoneNumber ?? '');
    const [country, setCountry]           = useState(existing.institutionalAddress?.country ?? '');
    const [countryCode, setCountryCode]   = useState('PT');
    const [city, setCity]                 = useState(existing.institutionalAddress?.city ?? '');
    const [district, setDistrict]         = useState(existing.institutionalAddress?.district ?? '');
    const [addressLine1, setAddressLine1] = useState(existing.institutionalAddress?.addressLine1 ?? '');
    const [addressLine2, setAddressLine2] = useState(existing.institutionalAddress?.addressLine2 ?? '');
    const [postalCode, setPostalCode]     = useState(existing.institutionalAddress?.postalCode ?? '');

    const parseDob = (dobStr) => {
        if (!dobStr) return new Date(2000, 0, 1);
        const [d, m, y] = dobStr.split('/');
        return new Date(Number(y), Number(m) - 1, Number(d));
    };
    const [date, setDate]                           = useState(parseDob(existing.dob));
    const [dob, setDob]                             = useState(existing.dob ?? '');
    const [showDatePicker, setShowDatePicker]       = useState(false);
    const [showCountryPicker, setShowCountryPicker] = useState(false);

    // ─── Dirty & focus tracking ───────────────────────────────────────────────
    const [isDirty, setIsDirty]           = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    // Wrap every setter so we also mark the form dirty
    const change = useCallback((setter) => (value) => {
        setter(value);
        setIsDirty(true);
    }, []);

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
            setIsDirty(true);
        }
    };

    const handleCountrySelect = (c) => {
        setCountryCode(c.cca2);
        setCountry(c.name);
        setShowCountryPicker(false);
        setFocusedField(null);
        setIsDirty(true);
    };

    const handleSave = async () => {
        if (!isDirty) return;
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

            setIsDirty(false);
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
                <View style={{ width: 22 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Field label="Full Name" focused={focusedField === 'fullName'} styles={styles}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={fullName}
                        onChangeText={change(setFullName)}
                        onFocus={() => setFocusedField('fullName')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Full Name"
                        placeholderTextColor={theme.subtext}
                    />
                </Field>

                <Field label="Date of birth" focused={focusedField === 'dob'} styles={styles}>
                    <TouchableOpacity
                        style={styles.rowBetween}
                        onPress={() => { setShowDatePicker(true); setFocusedField('dob'); }}
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

                <Field label="Username" focused={focusedField === 'username'} styles={styles}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={username}
                        onChangeText={change(setUsername)}
                        onFocus={() => setFocusedField('username')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="username"
                        placeholderTextColor={theme.subtext}
                        autoCapitalize="none"
                    />
                </Field>

                <Field label="Phone number" focused={focusedField === 'phone'} styles={styles}>
                    <View style={styles.rowStart}>
                        <CountryPicker
                            countryCode={countryCode}
                            withFlag
                            withEmoji
                            withFilter={false}
                            withCallingCode={false}
                            onSelect={handleCountrySelect}
                            visible={showCountryPicker}
                            onClose={() => setShowCountryPicker(false)}
                        />
                        <TextInput
                            style={[styles.input, { flex: 1, color: theme.text }]}
                            value={phoneNumber}
                            onChangeText={change(setPhoneNumber)}
                            onFocus={() => setFocusedField('phone')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="000 000 000"
                            placeholderTextColor={theme.subtext}
                            keyboardType="phone-pad"
                        />
                    </View>
                </Field>

                <Field label="Country" focused={focusedField === 'country'} styles={styles}>
                    <TouchableOpacity
                        style={styles.rowBetween}
                        onPress={() => { setShowCountryPicker(true); setFocusedField('country'); }}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.input, { color: country ? theme.text : theme.subtext, flex: 1 }]}>
                            {country || 'Select country'}
                        </Text>
                        <Iconify icon="lucide:chevron-down" size={18} color={theme.subtext} />
                    </TouchableOpacity>
                    <CountryPicker
                        countryCode={countryCode}
                        withFlag
                        withFilter
                        withEmoji
                        withCallingCode={false}
                        onSelect={handleCountrySelect}
                        visible={showCountryPicker}
                        onClose={() => { setShowCountryPicker(false); setFocusedField(null); }}
                        renderFlagButton={() => null}
                    />
                </Field>

                <Field label="City" focused={focusedField === 'city'} styles={styles}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={city}
                        onChangeText={change(setCity)}
                        onFocus={() => setFocusedField('city')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="City"
                        placeholderTextColor={theme.subtext}
                    />
                </Field>

                <Field label="District" focused={focusedField === 'district'} styles={styles}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={district}
                        onChangeText={change(setDistrict)}
                        onFocus={() => setFocusedField('district')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="District"
                        placeholderTextColor={theme.subtext}
                    />
                </Field>

                <Field label="Address Line 1" focused={focusedField === 'addr1'} styles={styles}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={addressLine1}
                        onChangeText={change(setAddressLine1)}
                        onFocus={() => setFocusedField('addr1')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Street address"
                        placeholderTextColor={theme.subtext}
                    />
                </Field>

                <Field label="Address Line 2" focused={focusedField === 'addr2'} styles={styles}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={addressLine2}
                        onChangeText={change(setAddressLine2)}
                        onFocus={() => setFocusedField('addr2')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Apartment, suite, etc. (optional)"
                        placeholderTextColor={theme.subtext}
                    />
                </Field>

                <Field label="Postal Code" focused={focusedField === 'postal'} styles={styles}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={postalCode}
                        onChangeText={change(setPostalCode)}
                        onFocus={() => setFocusedField('postal')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="0000-000"
                        placeholderTextColor={theme.subtext}
                        keyboardType="numbers-and-punctuation"
                    />
                </Field>

                {/* ── Submit ── */}
                <TouchableOpacity
                    style={[
                        styles.submitBtn,
                        !isDirty && styles.submitBtnDisabled,
                        isSaving && { opacity: 0.7 },
                    ]}
                    onPress={handleSave}
                    disabled={!isDirty || isSaving}
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

function Field({ label, focused, children, styles }) {
    return (
        <View style={[styles.field, focused && styles.fieldFocused]}>
            <Text style={[styles.fieldLabel, focused && styles.fieldLabelFocused]}>
                {label}
            </Text>
            {children}
        </View>
    );
}
