import React, { useState } from 'react';
import { Image } from 'expo-image';
import { View, TextInput, Text, TouchableOpacity, Modal, Platform, StatusBar } from 'react-native';
import { Iconify } from 'react-native-iconify';
import CountryPicker from 'react-native-country-picker-modal';

export default function StepThreeAddress({
                                             addressLine1, setAddressLine1,
                                             addressLine2, setAddressLine2,
                                             city, setCity,
                                             district, setDistrict,
                                             zipCode, setZipCode,
                                             country, setCountry,
                                             isRegistering, handleRegister, setStep,
                                             styles, theme
                                         }) {
    const [countryCode, setCountryCode] = useState('PT');
    const [showCountryPicker, setShowCountryPicker] = useState(false);

    const handleCountrySelect = (c) => {
        setCountryCode(c.cca2);
        setCountry(c.name);
        setShowCountryPicker(false);
    };

    return (
        <View>
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

            <TouchableOpacity
                style={[
                    styles.input,
                    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }
                ]}
                onPress={() => setShowCountryPicker(true)}
                activeOpacity={0.7}
            >
                <Text style={{ color: country ? theme.text : '#aaa', flex: 1 }}>
                    {country || 'Country'}
                </Text>
                <Iconify icon="lucide:chevron-down" size={18} color="#aaa" />
            </TouchableOpacity>
            <Modal
                visible={showCountryPicker}
                animationType="slide"
                onRequestClose={() => setShowCountryPicker(false)}
            >
                <View style={{
                    flex: 1,
                    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
                    backgroundColor: theme?.background || '#FFFFFF'
                }}>
                    <CountryPicker
                        countryCode={countryCode}
                        withFlag
                        withFilter
                        withEmoji
                        withCallingCode={false}
                        onSelect={handleCountrySelect}
                        onClose={() => setShowCountryPicker(false)}
                        renderFlagButton={() => null}
                        withModal={false}
                    />
                </View>
            </Modal>

            <Image
                source={require('../../../../assets/images/WormLayed.png')}
                style={styles.step3Image}
                contentFit="contain"
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
    );
}