// src/screens/CreateAnnouncementScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    useColorScheme,
} from 'react-native';
import { Colors } from '@readme/shared/src/constants/theme';
import { buildPublicationStyles } from '../../styles/publicationStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';

const FormInput = ({ label, placeholder, value, onChangeText, maxLength, styles }) => (
    <View style={styles.inputWrapper}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputUnderline}>
            <TextInput
                style={styles.textInput}
                placeholder={placeholder}
                placeholderTextColor="#888"
                value={value}
                onChangeText={onChangeText}
                maxLength={maxLength}
            />
            <Text style={styles.charCount}>
                {value.length} / {maxLength}
            </Text>
        </View>
    </View>
);

const FormTextArea = ({ label, placeholder, value, onChangeText, maxLength, styles }) => (
    <View style={styles.inputWrapper}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
            style={styles.textArea}
            placeholder={placeholder}
            placeholderTextColor="#888"
            value={value}
            onChangeText={onChangeText}
            maxLength={maxLength}
            multiline
        />
        <Text style={styles.textAreaCharCount}>
            {value.length} / {maxLength}
        </Text>
    </View>
);

// --- Ecrã Principal ---

export default function CreatePublicationScreen({ navigation }) {

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildPublicationStyles(theme);


    const [bookName, setBookName] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState(''); 

    const handleUpload = () => {
        console.log({ bookName, authorName, subject, description });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView 
                style={styles.container} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.mainContent}>
                    
                    {/* Top Content Group */}
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
                            <Iconify icon="lucide:camera" size={44} color="#E5AE7A" strokeWidth={1.5} />
                            <View style={styles.addPhotoRow}>
                                <Iconify icon="lucide:plus-circle" size={16} color="#444" />
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

                        {/* Fake Dropdown Subject Field */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Subject</Text>
                            <TouchableOpacity style={styles.inputUnderline} activeOpacity={0.7}>
                                <View style={styles.dropdownContent}>
                                    <Text style={subject ? styles.textInput : styles.dropdownPlaceholder}>
                                        {subject || "Choose the book's subject"}
                                    </Text>
                                </View>
                                <Iconify icon="lucide:chevron-down" size={20} color="#000" />
                            </TouchableOpacity>
                        </View>

                        <FormTextArea
                            label="Description"
                            placeholder="Write what you would like to read if it were you seeing this publication"
                            value={description}
                            onChangeText={setDescription}
                            maxLength={9000}
                            styles={styles}
                        />
                    </View>

                    {/* Submit Button (Sempre fixo no fundo) */}
                    <TouchableOpacity 
                        style={styles.submitButton} 
                        onPress={handleUpload}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.submitButtonText}>UPLOAD</Text>
                    </TouchableOpacity>

                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
