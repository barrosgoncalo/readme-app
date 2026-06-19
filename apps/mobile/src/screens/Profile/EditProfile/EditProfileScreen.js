import React, { useState, useMemo } from 'react';
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
    Modal,
    StyleSheet,
    Image,
    Keyboard
} from 'react-native';

import { Iconify } from 'react-native-iconify';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@readme/shared/src/constants/theme';
import { doUpdateUserProfile } from '@readme/shared/src/services/auth';
import { auth } from '@readme/shared/src/services/firebase';
import CountryPicker from 'react-native-country-picker-modal';
import { buildStyles } from '../../../styles/editProfileStyles';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfilePicture } from '@readme/shared/src/services/user';

export default function EditProfileScreen({ navigation, route }) {
    const existing = route?.params?.userData ?? {};

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme);

    const { currentUser, refreshUser } = useAuth();

    // ─── Image Upload State ──────────────────────────────────────────────────
    const [uploading, setUploading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [newImageUri, setNewImageUri] = useState(null);

    // ─── Original values (never mutated) ─────────────────────────────────────
    const original = useMemo(() => ({
        fullName:     existing.fullName     ?? currentUser.fullName,
        username:     existing.username     ?? currentUser.username,
        phoneNumber:  existing.phoneNumber  ?? currentUser.phoneNumber,
        country:      existing.institutionalAddress?.country    ?? currentUser.institutionalAddress?.country,
        city:         existing.institutionalAddress?.city       ?? currentUser.institutionalAddress?.city,
        district:     existing.institutionalAddress?.district   ?? currentUser.institutionalAddress?.district,
        addressLine1: existing.institutionalAddress?.addressLine1 ?? currentUser.institutionalAddress?.addressLine1,
        addressLine2: existing.institutionalAddress?.addressLine2 ?? currentUser.institutionalAddress?.addressLine2,
        postalCode:   existing.institutionalAddress?.postalCode ?? currentUser.institutionalAddress?.postalCode,
        dob:          existing.dob ?? currentUser.dob,
    }), [existing, currentUser]);

    // ─── Form state ───────────────────────────────────────────────────────────
    const [fullName, setFullName]         = useState(original.fullName);
    const [username, setUsername]         = useState(original.username);
    const [phoneNumber, setPhoneNumber]   = useState(original.phoneNumber);
    const [country, setCountry]           = useState(original.country);
    const [countryCode, setCountryCode]   = useState('PT');
    const [city, setCity]                 = useState(original.city);
    const [district, setDistrict]         = useState(original.district);
    const [addressLine1, setAddressLine1] = useState(original.addressLine1);
    const [addressLine2, setAddressLine2] = useState(original.addressLine2);
    const [postalCode, setPostalCode]     = useState(original.postalCode);

    const parseDob = (dobStr) => {
        if (!dobStr) return new Date(2000, 0, 1);
        const [d, m, y] = dobStr.split('/');
        return new Date(Number(y), Number(m) - 1, Number(d));
    };
    const [date, setDate]                           = useState(parseDob(original.dob));
    const [dob, setDob]                             = useState(original.dob);
    const [showDatePicker, setShowDatePicker]       = useState(false);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [focusedField, setFocusedField]           = useState(null);
    const [isSaving, setIsSaving]                   = useState(false);

    // ─── Per-field dirty check ────────────────────────────────────────────────
    const dirty = {
        fullName:     fullName     !== original.fullName,
        username:     username     !== original.username,
        phoneNumber:  phoneNumber  !== original.phoneNumber,
        country:      country      !== original.country,
        city:         city         !== original.city,
        district:     district     !== original.district,
        addressLine1: addressLine1 !== original.addressLine1,
        addressLine2: addressLine2 !== original.addressLine2,
        postalCode:   postalCode   !== original.postalCode,
        dob:          dob          !== original.dob,
        photo:        newImageUri  !== null,
    };

    const isAnyDirty = Object.values(dirty).some(Boolean);

    // ─── Image Handlers ───────────────────────────────────────────────────────
    const pickImage = async () => {
        setModalVisible(false);
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permissão necessária", "Precisamos de permissão para aceder à sua galeria.");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });
        
        if (!result.canceled) {
            setNewImageUri(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        setModalVisible(false);
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
            Alert.alert("Permissão necessária", "Precisamos de permissão para acessar a câmera.");
            return;
        }
        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: 'images', // <--- FIX: Changed from ['images'] to 'images'
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });
        if (!result.canceled) {
            setNewImageUri(result.assets[0].uri);
        }
    };

    // ─── Form Handlers ────────────────────────────────────────────────────────
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
        setFocusedField(null);
    };

    const handleSave = async () => {
        if (!isAnyDirty) return;
        if (!fullName || !username || !phoneNumber || !dob || !country || !city || !district || !addressLine1 || !postalCode) {
            Alert.alert('Missing fields', 'Please fill in all required fields.');
            return;
        }
        setIsSaving(true);
        try {
            const uid = auth.currentUser?.uid;
            if (!uid) throw new Error('Not authenticated.');

            if (newImageUri) {
                await uploadProfilePicture(uid, newImageUri);
            }

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

            await refreshUser();

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
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                onScrollBeginDrag={() => {
                    if (focusedField === "dob") {
                        setShowDatePicker(false);
                        setFocusedField(null);
                    }
                }}
                >
                {/* ── Avatar Edit Section ── */}
                <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 20 }}>
                    <TouchableOpacity 
                        onPress={() => {
                            setModalVisible(true);
                            setFocusedField(null);
                            Keyboard.dismiss();
                            setShowDatePicker(false)
                        }}
                        disabled={uploading} 
                        activeOpacity={0.8}
                        style={{ position: 'relative' }}
                    >
                        <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: theme.iconBg || '#EAEAEA', justifyContent: 'center', alignItems: 'center' }}>
                            {newImageUri || currentUser?.photoURL ? (
                                <Image 
                                    source={{ 
                                        uri: newImageUri 
                                            ? newImageUri 
                                            : `${currentUser.photoURL}?t=${new Date().getTime()}` 
                                    }} 
                                    style={[
                                        { width: 100, height: 100, borderRadius: 50 },
                                        newImageUri && { borderWidth: 3, borderColor: '#F58B2E' } 
                                    ]} 
                                />
                            ) : (
                                    <Iconify icon="lucide:user" size={45} color={theme.text} />
                                )}
                        </View>

                        <View style={localStyles.pencilButtonContainer}>
                            <View style={localStyles.pencilMiddleLayer}>
                                <Iconify icon="material-symbols:edit-rounded" size={15} color="#F58B2E" />
                            </View>
                        </View>

                        {uploading && (
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 50 }}>
                                <ActivityIndicator size="large" color="#F58B2E" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* ── Form Fields ── */}
                <Field label="Full Name" dirty={dirty.fullName} focused={focusedField === 'fullName'} styles={styles}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={fullName}
                        onChangeText={setFullName}
                        onFocus={() => {
                            setFocusedField('fullName');
                            setShowDatePicker(false);
                        }}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Full Name"
                        placeholderTextColor={theme.subtext}
                    />
                </Field>

                <Field label="Date of birth" dirty={dirty.dob} focused={focusedField === 'dob'} styles={styles}>
                    <TouchableOpacity
                        style={styles.rowBetween}
                        onPress={() => {
                            Keyboard.dismiss();
                            // Delays the highlight by 100ms so the previous input's onBlur
                            // doesn't overwrite it.
                            setTimeout(() => {
                                setShowDatePicker(true);
                                setFocusedField('dob');
                            }, 100);
                        }}                        activeOpacity={0.7}
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

                <Field label="Username" dirty={dirty.username} focused={focusedField === 'username'} styles={styles}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={username}
                        onChangeText={setUsername}
                        onFocus={() => {
                            setFocusedField('username');
                            setShowDatePicker(false);
                        }}
                        onBlur={() => setFocusedField(null)}
                        placeholder="username"
                        placeholderTextColor={theme.subtext}
                        autoCapitalize="none"
                    />
                </Field>

                <Field label="Phone number" dirty={dirty.phoneNumber} focused={focusedField === 'phone'} styles={styles}>
                    <View style={styles.rowStart}>
                        <TextInput
                            style={[styles.input, { flex: 1, color: theme.text }]}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            onFocus={() => {
                                setFocusedField('phone');
                                setShowDatePicker(false);
                            }}
                            onBlur={() => setFocusedField(null)}
                            placeholder="000 000 000"
                            placeholderTextColor={theme.subtext}
                            keyboardType="phone-pad"
                        />
                    </View>
                </Field>

                <Field label="Country" dirty={dirty.country} focused={focusedField === 'country'} styles={styles}>
                    <TouchableOpacity
                        style={styles.rowBetween}
                        onPress={() => {
                            setShowCountryPicker(true);
                            setFocusedField('country');
                            setShowDatePicker(false);
                        }}
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

                <Field label="City" dirty={dirty.city} focused={focusedField === 'city'} styles={styles}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={city}
                        onChangeText={setCity}
                        onFocus={() => {
                            setFocusedField('city');
                            setShowDatePicker(false);
                        }}
                        onBlur={() => setFocusedField(null)}
                        placeholder="City"
                        placeholderTextColor={theme.subtext}
                    />
                </Field>

                <Field label="District" dirty={dirty.district} focused={focusedField === 'district'} styles={styles}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={district}
                        onChangeText={setDistrict}
                        onFocus={() => {
                            setFocusedField('district');
                            setShowDatePicker(false);
                        }}
                        onBlur={() => setFocusedField(null)}
                        placeholder="District"
                        placeholderTextColor={theme.subtext}
                    />
                </Field>

                <Field label="Address Line 1" dirty={dirty.addressLine1} focused={focusedField === 'addr1'} styles={styles}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={addressLine1}
                        onChangeText={setAddressLine1}
                        onFocus={() => {
                            setFocusedField('addr1');
                            setShowDatePicker(false);
                        }}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Street address"
                        placeholderTextColor={theme.subtext}
                    />
                </Field>

                <Field label="Address Line 2" dirty={dirty.addressLine2} focused={focusedField === 'addr2'} styles={styles}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={addressLine2}
                        onChangeText={setAddressLine2}
                        onFocus={() => {
                            setFocusedField('addr2');
                            setShowDatePicker(false);
                        }}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Apartment, suite, etc. (optional)"
                        placeholderTextColor={theme.subtext}
                    />
                </Field>

                <Field label="Postal Code" dirty={dirty.postalCode} focused={focusedField === 'postal'} styles={styles}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={postalCode}
                        onChangeText={setPostalCode}
                        onFocus={() => {
                            setFocusedField('postal');
                            setShowDatePicker(false);
                        }}
                        onBlur={() => setFocusedField(null)}
                        placeholder="0000-000"
                        placeholderTextColor={theme.subtext}
                        keyboardType="numbers-and-punctuation"
                    />
                </Field>

                <TouchableOpacity
                    style={[
                        styles.submitBtn,
                        !isAnyDirty && styles.submitBtnDisabled,
                        isSaving && { opacity: 0.7 },
                    ]}
                    onPress={handleSave}
                    disabled={!isAnyDirty || isSaving}
                    activeOpacity={0.85}
                >
                    {isSaving
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={[styles.submitText, !isAnyDirty && styles.submitTextDisabled]}>
                            SAVE CHANGES
                        </Text>
                    }
                </TouchableOpacity>
            </ScrollView>

            {/* --- EDIT PICTURE OPTIONS MODAL --- */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <TouchableOpacity style={localStyles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
                    <View style={[localStyles.modalContent, { backgroundColor: theme.background || '#FFF' }]}>
                        <View style={localStyles.modalHeaderIndicator} />
                        <Text style={[localStyles.modalTitle, { color: theme.text || '#000' }]}>Alterar foto de perfil</Text>
                        <TouchableOpacity style={localStyles.modalOption} onPress={pickImage}>
                            <Iconify icon="lucide:image" size={22} color="#F58B2E" />
                            <Text style={[localStyles.modalOptionText, { color: theme.text || '#000' }]}>Escolher da Galeria</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={localStyles.modalOption} onPress={takePhoto}>
                            <Iconify icon="lucide:camera" size={22} color="#F58B2E" />
                            <Text style={[localStyles.modalOptionText, { color: theme.text || '#000' }]}>Tirar Foto Nova</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[localStyles.modalOption, localStyles.cancelOption]} onPress={() => setModalVisible(false)}>
                            <Text style={localStyles.cancelOptionText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, dirty, focused, children, styles }) {
    const isHighlighted = dirty || focused;
    return (
        <View style={[styles.field, isHighlighted && styles.fieldHighlighted]}>
            <Text style={[styles.fieldLabel, isHighlighted && styles.fieldLabelHighlighted]}>
                {label}
            </Text>
            {children}
        </View>
    );
}

// ─── Modal & Pencil Styles ────────────────────────────────────────────────────
const localStyles = StyleSheet.create({
    pencilButtonContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 4, 
    },
    pencilMiddleLayer: {
        backgroundColor: '#F2F0EF',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 14,
    },
    modalHeaderIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#EAEAEA',
    },
    modalOptionText: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 14,
    },
    cancelOption: {
        borderBottomWidth: 0,
        justifyContent: 'center',
        marginTop: 10,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
    },
    cancelOptionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    }
});
