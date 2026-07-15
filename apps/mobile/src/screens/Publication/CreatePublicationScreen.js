import React, { useState } from 'react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import {
    View,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert
} from 'react-native';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { buildPublicationStyles } from '../../styles/publicationStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import SuccessModal from '../../components/ui/SuccessModal';
import { PhotoGalleryEditor } from '../../components/ui/PhotoGalleryEditor';
import { FormLineInput, FormTextArea, FormDropdown } from '../../components/ui/FormsComponents';
import { BOOK_CONDITIONS, BOOK_GENRES } from '@readme/shared/src/constants/bookOptions';

import { PublicationService } from '@readme/shared/src/services/publications';
import { useImagePicker } from '@readme/shared/src/hooks/use-image-picker';

export default function CreatePublicationScreen({ navigation }) {
    const theme = useTheme();
    const styles = buildPublicationStyles(theme);

    const [bookName, setBookName] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [description, setDescription] = useState('');

    const [isUploading, setIsUploading] = useState(false);

    const [subject, setSubject] = useState(''); 
    const [condition, setCondition] = useState(''); 
    const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);

    const { currentUser } = useAuth();

    const { images, takePhoto, pickFromGallery, removeImage } = useImagePicker({
        mode: 'multiple',
        compress: true,
    });

    // ==========================================
    // IMAGE HANDLING LOGIC
    // ==========================================

    const handleAddImagePress = () => {
        Alert.alert("Add Photo", "Choose a method to add a photo", [
            { text: "Take a Photo", onPress: async () => {
                const r = await takePhoto();
                if (r.deniedPermission) Alert.alert("Permission Required", "We need access to your camera to take photos.");
            }},
            { text: "Choose from Gallery", onPress: async () => {
                const r = await pickFromGallery();
                if (r.deniedPermission) Alert.alert("Permission Required", "We need access to your gallery to upload photos.");
            }},
            { text: "Cancel", style: "cancel" }
        ]);
    };

    // ==========================================
    // UPLOAD LOGIC
    // ==========================================

    const handleUpload = async () => {
        if (!bookName || images.length === 0) {
            Alert.alert("Missing Information", "Please add a title and at least one photo.");
            return;
        }

        setIsUploading(true);
        try {
            await PublicationService.createPublication(
                currentUser,
                { bookName, authorName, description, subject, condition },
                images
            );
            setIsUploading(false);
            setSuccessModalVisible(true);
        } catch (error) {
            setIsUploading(false);
            console.error(`${error.stage || 'Unknown'} Error:`, error);
            if (error.stage === 'storage') {
                Alert.alert("Storage Permission Error", "Firebase blocked the image upload. Please check your Firebase Storage Rules in the console.");
            } else if (error.stage === 'firestore') {
                Alert.alert("Firestore Permission Error", "Database blocked the save. Ensure the current user has 'accountStatus: \"active\"' in their user document.");
            } else {
                Alert.alert("Error", error.message);
            }
        }
    };

    const handleGoHome = () => {
        setSuccessModalVisible(false);
        navigation.goBack(); 
    };

    return (
        <SafeAreaView style={[styles.safeArea, { flex: 1 }]}>
            <KeyboardAvoidingView 
                style={[styles.container, { flex: 1 }]} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={[styles.mainContent, { flex: 1 }]}>
                    <ScrollView 
                        style={{ flex: 1 }} 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
                    >
                        <View style={styles.topFieldsContainer}>
                            <View style={styles.header}>
                                <Text style={styles.headerTitle}>Create{'\n'}Publication</Text>
                                <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                                    <Iconify icon="lucide:x" size={28} color={theme.text} />
                                </TouchableOpacity>
                            </View>

                            <PhotoGalleryEditor
                                images={images}
                                onRemove={removeImage}
                                onAddPress={handleAddImagePress}
                                theme={theme}
                            />

                            <FormLineInput
                                label="Book's Name"
                                placeholder="e.g. Art of War"
                                value={bookName}
                                onChangeText={setBookName}
                                maxLength={80}
                                styles={styles}
                            />

                            <FormLineInput
                                label="Author's Name"
                                placeholder="e.g. Sun Tzu"
                                value={authorName}
                                onChangeText={setAuthorName}
                                maxLength={50}
                                styles={styles}
                            />

                            <FormDropdown
                                label="Subject"
                                placeholder="Choose the book's subject"
                                value={subject}
                                onSelect={setSubject}
                                options={BOOK_GENRES}
                                styles={styles}
                            />

                            <FormDropdown
                                label="Condition"
                                placeholder="Choose the book's condition"
                                value={condition}
                                onSelect={setCondition}
                                options={BOOK_CONDITIONS}
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

                    <TouchableOpacity 
                        style={[styles.submitButton, { marginTop: 'auto', opacity: isUploading ? 0.7 : 1 }]} 
                        onPress={handleUpload}
                        activeOpacity={0.8}
                        disabled={isUploading}
                    >
                        <Text style={styles.submitButtonText}>
                            {isUploading ? 'UPLOADING...' : 'UPLOAD'}
                        </Text>
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
