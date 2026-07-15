import React from 'react';
import { View, TouchableOpacity, Image, Text, ScrollView } from 'react-native';
import { Iconify } from 'react-native-iconify';

/**
 * Presentational horizontal gallery of picked images with remove buttons,
 * plus a trailing dashed "add photo" tile. No picking/upload logic —
 * pair with useImagePicker (or similar) for that.
 *
 * @param {string[]} images - array of image URIs to display
 * @param {(index: number) => void} onRemove - called when a thumbnail's remove button is tapped
 * @param {() => void} onAddPress - called when the "add photo" tile is tapped
 * @param {object} theme - theme object (expects theme.background, theme.secondary, theme.subtext)
 */
export function PhotoGalleryEditor({ images, onRemove, onAddPress, theme }) {
    return (
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
                        onPress={() => onRemove(index)}
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
                onPress={onAddPress}
            >
                <Iconify icon="lucide:plus" size={32} color={theme.subtext} />
                <Text style={{ color: theme.subtext, fontSize: 12, marginTop: 4 }}>Add photo</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
