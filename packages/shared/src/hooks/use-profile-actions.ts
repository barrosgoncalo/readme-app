import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { doSignOut, doUpdateUserProfile } from '../services/auth';
import { UsersService } from '../services/users';

export function useProfileActions(currentUser, refreshUser) {
    const [uploading, setUploading] = useState(false);
    const [hasNotifications, setHasNotifications] = useState(
        currentUser?.notificationSettings?.pushEnabled ?? false
    );

    const handleUpload = async (imageUri) => {
        setUploading(true);
        try {
            await UsersService.uploadProfilePicture(currentUser.uid, imageUri);
            Alert.alert("Success", "Foto atualizada com sucesso!");
        } catch (error) {
            Alert.alert("Error", "Erro ao atualizar a foto.");
        } finally {
            setUploading(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            handleUpload(result.assets[0].uri);
        }
    };

    const handleNotificationsToggle = async (newValue) => {
        setHasNotifications(newValue);
        try {
            await doUpdateUserProfile(currentUser.uid, {
                'notificationSettings.pushEnabled': newValue
            });
            await refreshUser();
        } catch (error) {
            console.error("Error updating notifications settings:", error);
            Alert.alert("Error", "Failed to update notifications settings. Please try again.");
            setHasNotifications(!newValue);
        }
    };

    const handleSignOut = async () => {
        await doSignOut();
    };

    return {
        uploading,
        hasNotifications,
        pickImage,
        handleNotificationsToggle,
        handleSignOut,
    };
}
