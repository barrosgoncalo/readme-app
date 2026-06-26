import React from 'react';
import { View, TextInput, Text, TouchableOpacity, Image, Switch, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ROUTES } from '@readme/shared/src/constants/routes';

export default function StepTwoPersonal({
    phoneNumber, setPhoneNumber,
    dob, date, showDatePicker, setShowDatePicker, handleDateChange,
    isPublic, setIsPublic,
    isGoogleUser, setStep, handleStep2Next, navigation,
    styles, theme
}) {
    return (
        <View>
            <Image
                source={require('../../../../assets/images/WormLookingDownBook.png')}
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

            <View style={styles.rowButtons}>
                {isGoogleUser ? (
                    <TouchableOpacity
                        style={[styles.primaryButton, styles.backButton]}
                        onPress={() => navigation.navigate(ROUTES.LOGIN)}
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
    );
}
