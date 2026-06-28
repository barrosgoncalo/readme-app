// src/screens/CreateAnnouncementScreen.js
import React, { useState } from 'react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import {
    View,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    useColorScheme,
    ScrollView,
    Image,
    Alert
} from 'react-native';
import { Colors } from '@readme/shared/src/constants/theme';
import { buildPublicationStyles } from '../../styles/publicationStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import SuccessModal from '../../components/ui/SuccessModal';
import { FormLineInput, FormTextArea, FormDropdown } from '../../components/ui/FormsComponents';

// Firebase imports
import { doc, setDoc } from 'firebase/firestore'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@readme/shared/src/services/firebase';
import { createPublicationModel } from '@readme/shared/src/models/publication';
import * as ImagePicker from 'expo-image-picker'; 

export default function CreatePublicationScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildPublicationStyles(theme);

    const [bookName, setBookName] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [description, setDescription] = useState('');

    const [images, setImages] = useState([]); 
    const [isUploading, setIsUploading] = useState(false);

    const [subject, setSubject] = useState(''); 
    const [condition, setCondition] = useState(''); 
    const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);

    const SUBJECT_OPTIONS = ['Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'History', 'Biography', 'Textbook'];
    const CONDITION_OPTIONS = ['Brand New', 'Like New', 'Good', 'Fair', 'Poor (Reading Copy)'];

    const { currentUser } = useAuth();

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "We need access to your gallery to upload photos.");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsMultipleSelection: true, 
            allowsEditing: false, 
            quality: 0.8,            
        });

        if (!result.canceled) {
            const newUris = result.assets.map(asset => asset.uri);
            setImages(prevImages => [...prevImages, ...newUris]);
        }
    };

    const removeImage = (indexToRemove) => {
        setImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
    };

    const handleUpload = async () => {
        if (!bookName || images.length === 0) {
            Alert.alert("Missing Information", "Please add a title and at least one photo.");
            return;
        }

        setIsUploading(true);

        const timestamp = Date.now();
        const customPublicationId = `${currentUser.uid}_${timestamp}`;
        const generatedBookId = `book_${bookName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${timestamp}`;

        let uploadedImageUrls = [];

        // ==========================================
        // STAGE 1: UPLOAD IMAGES TO FIREBASE STORAGE
        // ==========================================
        try {
            uploadedImageUrls = await Promise.all(
                images.map(async (uri, index) => {
                    const blob = await new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.onload = () => resolve(xhr.response);
                        xhr.onerror = (e) => reject(new TypeError('Network request failed'));
                        xhr.responseType = 'blob';
                        xhr.open('GET', uri, true);
                        xhr.send(null);
                    });

                    const imageRef = ref(storage, `books/${customPublicationId}/image_${index}`);
                    await uploadBytes(imageRef, blob);
                    blob.close();

                    return await getDownloadURL(imageRef);
                })
            );
        } catch (error) {
            setIsUploading(false);
            console.error("Storage Error:", error);
            Alert.alert(
                "Storage Permission Error", 
                "Firebase blocked the image upload. Please check your Firebase Storage Rules in the console."
            );
            return; // Stop the function here if images fail
        }

        // ==========================================
        // STAGE 2: SAVE TEXT DATA TO FIRESTORE
        // ==========================================
        try {
            const sellerName = currentUser?.username || currentUser?.displayName || currentUser?.name || 'Anonymous Swapper';
            const sellerAvatar = currentUser?.photoURL || currentUser?.profilePicture || currentUser?.avatarUrl || null;

            const publicationData = createPublicationModel(
                currentUser.uid, 
                sellerName,
                sellerAvatar,
                {
                    title: bookName,
                    author: authorName || "Unknown Author",
                    images: uploadedImageUrls, 
                    bookId: generatedBookId,
                    condition: condition,
                    subject: subject
                }, 
                description
            );

            await setDoc(doc(db, 'publications', customPublicationId), publicationData);

            console.log("Successfully published:", customPublicationId);
            setIsUploading(false);
            setSuccessModalVisible(true);

        } catch (error) {
            setIsUploading(false);
            console.error("Firestore Error:", error);
            Alert.alert(
                "Firestore Permission Error", 
                "Database blocked the save. Ensure the current user has 'accountStatus: \"active\"' in their user document."
            );
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

                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 12, paddingVertical: 10 }}
                                style={{ marginBottom: 20 }}
                            >
                                {images.map((uri, index) => (
                                    <View key={index} style={{ width: 100, height: 133, position: 'relative' }}>
                                        <Image 
                                            source={{ uri }} 
                                            style={{ width: '100%', height: '100%', borderRadius: 12 }} 
                                        />
                                        <TouchableOpacity 
                                            style={{ 
                                                position: 'absolute', 
                                                top: -8, 
                                                right: -8, 
                                                backgroundColor: theme.background, 
                                                borderRadius: 12 
                                            }}
                                            onPress={() => removeImage(index)}
                                            activeOpacity={0.7}
                                        >
                                            <Iconify icon="lucide:x-circle" size={24} color={theme.text} />
                                        </TouchableOpacity>
                                    </View>
                                ))}

                                <TouchableOpacity 
                                    style={{
                                        width: 100, 
                                        height: 133, 
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: theme.secondary,
                                        borderStyle: 'dashed',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        backgroundColor: theme.background
                                    }} 
                                    activeOpacity={0.7} 
                                    onPress={handlePickImage}
                                >
                                    <Iconify icon="lucide:plus" size={32} color={theme.subtext} />
                                    <Text style={{ color: theme.subtext, fontSize: 12, marginTop: 4 }}>Add photo</Text>
                                </TouchableOpacity>
                            </ScrollView>

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
                                options={SUBJECT_OPTIONS}
                                styles={styles}
                            />

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
