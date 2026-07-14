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
import { ROUTES } from '@readme/shared/src/constants/routes';

import { PublicationService } from '@readme/shared/src/services/publications';
import { useImagePicker } from '@readme/shared/src/hooks/use-image-picker';

export default function UpdatePublicationScreen({ navigation, route }) {
    const theme = useTheme();
    const styles = buildPublicationStyles(theme);
    const { currentUser } = useAuth();

    // publication.publicationData is the raw doc (per _mapPublicationDetails),
    // so read the nested book fields from there for accurate initial values
    const { publication } = route.params;
    const raw = publication.publicationData || publication.rawDocData || {};

    const [bookName, setBookName] = useState(raw.book?.title || publication.title || '');
    const [authorName, setAuthorName] = useState(raw.book?.author || publication.author || '');
    const [description, setDescription] = useState(raw.detailsText || publication.description || '');
    const [subject, setSubject] = useState(raw.book?.subject || publication.subject || '');
    const [condition, setCondition] = useState(raw.book?.condition || publication.condition || '');

    const [isUploading, setIsUploading] = useState(false);
    const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);

    // Existing remote URLs live separately from useImagePicker's local-only state,
    // since the hook has no concept of "already uploaded" images.
    const [existingImages, setExistingImages] = useState(
        raw.book?.images || publication.images || []
    );
    const { images: newImages, takePhoto, pickFromGallery, removeImage } = useImagePicker({
        mode: 'multiple',
        compress: true,
    });

    const combinedImages = [...existingImages, ...newImages];

    // PhotoGalleryEditor gives back a flat index into the combined array;
    // route it to the right underlying array based on where the split falls.
    const handleRemoveImage = (index) => {
        if (index < existingImages.length) {
            setExistingImages((prev) => prev.filter((_, i) => i !== index));
        } else {
            removeImage(index - existingImages.length);
        }
    };

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

    const handleUpdate = async () => {
        if (!bookName || combinedImages.length === 0) {
            Alert.alert("Missing Information", "Please keep at least a title and one photo.");
            return;
        }

        setIsUploading(true);
        try {
            await PublicationService.updatePublication(
                currentUser,
                publication.id,
                { bookName, authorName, description, subject, condition },
                { existingImages, newImages }
            );
            setIsUploading(false);
            setSuccessModalVisible(true);
        } catch (error) {
            setIsUploading(false);
            console.error(`${error.stage || 'Unknown'} Error:`, error);
            if (error.stage === 'storage') {
                Alert.alert("Storage Permission Error", "Firebase blocked the image upload. Please check your Firebase Storage Rules in the console.");
            } else if (error.stage === 'firestore') {
                Alert.alert("Firestore Permission Error", "Database blocked the update. Ensure the current user has 'accountStatus: \"active\"' in their user document.");
            } else {
                Alert.alert("Error", error.message);
            }
        }
    };

    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        Alert.alert(
            "Delete Publication",
            "This can't be undone. Are you sure you want to delete this publication?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            await PublicationService.deletePublication(currentUser, publication.id);
                            setIsDeleting(false);
                            navigation.navigate(ROUTES.MY_BOOKS);
                        } catch (error) {
                            if (error.stage === 'validation')
                                Alert.alert(
                                    "Unable To Delete Publication",
                                    "You can only delete publications that are not currently in any trade.",

                                )
                            else {
                                console.error(`${error.stage || 'Unknown'} Error:`, error);
                                Alert.alert("Error", "Something went wrong while deleting. Please try again.");
                            }
                            setIsDeleting(false);
                        }
                    }
                }
            ]
        );
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
                                <Text style={styles.headerTitle}>Edit{'\n'}Publication</Text>
                                <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                                    <Iconify icon="lucide:x" size={28} color={theme.text} />
                                </TouchableOpacity>
                            </View>

                            <PhotoGalleryEditor
                                images={combinedImages}
                                onRemove={handleRemoveImage}
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
                        style={[styles.submitButton, { marginTop: 10, opacity: isUploading ? 0.7 : 1 }]}
                        onPress={handleUpdate}
                        activeOpacity={0.8}
                        disabled={isUploading}
                    >
                        <Text style={styles.submitButtonText}>
                            {isUploading ? 'SAVING...' : 'SAVE CHANGES'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.deleteButton, { opacity: isDeleting ? 0.7 : 1 }]}
                        onPress={handleDelete}
                        activeOpacity={0.8}
                        disabled={isUploading || isDeleting}
                    >
                        <Text style={styles.deleteButtonText}>
                            {isDeleting ? 'DELETING...' : 'DELETE PUBLICATION'}
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