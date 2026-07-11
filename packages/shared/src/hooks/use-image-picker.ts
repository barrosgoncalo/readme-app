// hooks/use-image-picker.ts
import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

type PickerOptions = {
    mode?: 'single' | 'multiple';   // default 'multiple'
    aspect?: [number, number];      // native crop aspect, omit for freeform
    allowsEditing?: boolean;        // default false
    compress?: boolean;             // run ImageManipulator (resize/JPEG), default false
};

type PickResult =
| { canceled: true; deniedPermission: true; uri?: undefined }
| { canceled: true; deniedPermission: false; uri?: undefined }
| { canceled: false; deniedPermission: false; uri: string };

export function useImagePicker(options: PickerOptions = {}) {
    const { mode = 'multiple', aspect, allowsEditing = false, compress = false } = options;

    const [images, setImages] = useState<string[]>([]);

    const processUri = useCallback(async (rawUri: string) => {
        if (!compress) return rawUri;
        try {
            const result = await ImageManipulator.manipulateAsync(
                rawUri,
                [],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );
            return result.uri;
        } catch (error) {
            console.error('Failed to process image:', error);
            return rawUri; // fallback to raw, matches CreatePublication's existing behavior
        }
    }, [compress]);

    const commit = useCallback((uri: string) => {
        setImages(prev => (mode === 'single' ? [uri] : [...prev, uri]));
    }, [mode]);

    const takePhoto = useCallback(async (): Promise<PickResult> => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return { canceled: true, deniedPermission: true };

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: 'images',
            allowsEditing,
            ...(aspect ? { aspect } : {}),
            quality: 1,
        });
        if (result.canceled) return { canceled: true, deniedPermission: false };

        const uri = await processUri(result.assets[0].uri);
        commit(uri);
        return { canceled: false, deniedPermission: false, uri };
    }, [allowsEditing, aspect, processUri, commit]);

    const pickFromGallery = useCallback(async (): Promise<PickResult> => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return { canceled: true, deniedPermission: true };

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing,
            ...(aspect ? { aspect } : {}),
            allowsMultipleSelection: false,
            quality: 1,
        });
        if (result.canceled) return { canceled: true, deniedPermission: false };

        const uri = await processUri(result.assets[0].uri);
        commit(uri);
        return { canceled: false, deniedPermission: false, uri };
    }, [allowsEditing, aspect, processUri, commit]);


    const removeImage = useCallback((indexToRemove: number) => {
        setImages(prev => prev.filter((_, i) => i !== indexToRemove));
    }, []);

    const reset = useCallback(() => setImages([]), []);

    return { images, takePhoto, pickFromGallery, removeImage, reset };
}
