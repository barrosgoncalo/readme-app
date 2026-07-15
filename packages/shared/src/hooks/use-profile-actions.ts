// use-profile-actions.ts
import { useState } from 'react';
import { Alert } from 'react-native';
import { doSignOut, doUpdateUserProfile } from '../services/auth';
import { UsersService } from '../services/users';
import { useImagePicker } from './use-image-picker';

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

    const { pickFromGallery } = useImagePicker({
        mode: 'single',
        aspect: [1, 1],
        allowsEditing: true,
    });

    const pickImage = async () => {
        const result = await pickFromGallery();
        if (result.deniedPermission) {
            Alert.alert("Permissão necessária", "Precisamos de permissão para aceder à sua galeria.");
            return;
        }
        if (!result.canceled) {
            await handleUpload(result.uri);
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
