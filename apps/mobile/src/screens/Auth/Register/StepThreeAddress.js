import React from 'react';
import { View, TextInput, Text, TouchableOpacity, Image } from 'react-native';

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
            <TextInput
                placeholder="Country"
                value={country}
                onChangeText={setCountry}
                style={styles.input}
                placeholderTextColor="#aaa"
            />

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
