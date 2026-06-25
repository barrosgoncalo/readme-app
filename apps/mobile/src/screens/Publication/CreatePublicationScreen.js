// src/screens/CreateAnnouncementScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    useColorScheme,
    ScrollView
} from 'react-native';
import { Colors } from '@readme/shared/src/constants/theme';
import { buildPublicationStyles } from '../../styles/publicationStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import SuccessModal from '../../components/ui/SuccessModal';
import { FormInput, FormTextArea, FormDropdown  } from '../../components/ui/FormsComponents';

export default function CreatePublicationScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildPublicationStyles(theme);

    const [bookName, setBookName] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [description, setDescription] = useState('');
    
    // Dropdown States
    const [subject, setSubject] = useState(''); 
    const [condition, setCondition] = useState(''); 
    const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);

    // Dropdown Data Arrays
    const SUBJECT_OPTIONS = ['Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'History', 'Biography', 'Textbook'];
    const CONDITION_OPTIONS = ['Brand New', 'Like New', 'Good', 'Fair', 'Poor (Reading Copy)'];

    const handleUpload = () => {
        console.log({ bookName, authorName, subject, condition, description });
        setSuccessModalVisible(true);
    };

    const handleGoHome = () => {
        setSuccessModalVisible(false);
        navigation.goBack(); 
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView 
                style={styles.container} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Ensure styles.mainContent has `flex: 1` 
                  so it fills the screen and pushes the button down 
                */}
                <View style={styles.mainContent}>

                    {/* Scrollable Container for Form Fields */}
                    <ScrollView 
                        style={{ flex: 1 }} 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }} // Adds a bit of padding at the very bottom of the scroll
                    >
                        <View style={styles.topFieldsContainer}>
                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.headerTitle}>Create{'\n'}Publication</Text>
                                <TouchableOpacity 
                                    style={styles.closeButton} 
                                    onPress={() => navigation.goBack()}
                                >
                                    <Iconify icon="lucide:x" size={28} color="#000" />
                                </TouchableOpacity>
                            </View>

                            {/* Photo Upload Box */}
                            <TouchableOpacity style={styles.uploadBox} activeOpacity={0.7}>
                                <Iconify
                                    icon="lucide:camera"
                                    size={44}
                                    color={theme.secondary}
                                    opacity={0.8}
                                    strokeWidth={1.5}
                                />
                                <View style={styles.addPhotoRow}>
                                    <Iconify icon="lucide:plus-circle" size={16} color={theme.subtext} />
                                    <Text style={styles.addPhotoText}>Add photos</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Form Fields */}
                            <FormInput
                                label="Book's Name"
                                placeholder="e.g. Art of War"
                                value={bookName}
                                onChangeText={setBookName}
                                maxLength={80}
                                styles={styles}
                            />

                            <FormInput
                                label="Author's Name"
                                placeholder="e.g. Sun Tzu"
                                value={authorName}
                                onChangeText={setAuthorName}
                                maxLength={50}
                                styles={styles}
                            />

                            {/* Real Dropdown Subject Field */}
                            <FormDropdown
                                label="Subject"
                                placeholder="Choose the book's subject"
                                value={subject}
                                onSelect={setSubject}
                                options={SUBJECT_OPTIONS}
                                styles={styles}
                            />

                            {/* Real Dropdown Condition Field */}
                            <FormDropdown
                                label="Condition"
                                placeholder="Choose the book's condition"
                                value={condition}
                                onSelect={setCondition}
                                options={CONDITION_OPTIONS}
                                styles={styles}
                            />

                            <FormTextArea
                                label="Description"
                                placeholder="Write what you would like to read if it were you seeing this publication"
                                value={description}
                                onChangeText={setDescription}
                                maxLength={9000}
                                styles={styles}
                            />
                        </View>
                    </ScrollView>

                    {/* Submit Button (Permanently anchored to the bottom) */}
                    <TouchableOpacity 
                        style={[styles.submitButton, { marginTop: 'auto' }]} 
                        onPress={handleUpload}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.submitButtonText}>UPLOAD</Text>
                    </TouchableOpacity>

                    <SuccessModal 
                        visible={isSuccessModalVisible}
                        onClose={() => setSuccessModalVisible(false)}
                        onGoHome={handleGoHome}
                        bookName={bookName}
                    />

                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
