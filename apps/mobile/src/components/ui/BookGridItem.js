import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Iconify } from 'react-native-iconify';

export const BookGridItem = ({ 
    bookId, 
    title, 
    author, 
    imageUrl, 
    onPress, 
    styles, 
    theme, 
    isFavorite,         // Passed exactly as it is in the parent's state
    favoriteCount = 0,  // Passed from parent
    onToggleFavorite    // The function passed from ExploreScreen
}) => {
    const localStyles = createLocalStyles(theme);
    const activeHeartColor = theme.heart; 
    const inactiveHeartColor = theme.textItemTitle;

    return (
        <TouchableOpacity style={styles.bookGridWrapper} activeOpacity={0.8} onPress={onPress}>
            <View style={[styles.bookCoverContainer, { position: 'relative' }]}>
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.bookGridImage}
                />
                
                <TouchableOpacity 
                    style={localStyles.favoriteButton}
                    onPress={() => onToggleFavorite(bookId, isFavorite, favoriteCount)}
                    activeOpacity={0.7}
                >
                    <Iconify 
                        icon={isFavorite ? "mdi:cards-heart" : "mdi:cards-heart-outline"} 
                        size={16} 
                        color={isFavorite ? activeHeartColor : inactiveHeartColor} 
                    />
                    {favoriteCount > 0 && (
                        <Text style={[
                            localStyles.favoriteCountText, 
                            { color: isFavorite ? activeHeartColor : inactiveHeartColor }
                        ]}>
                            {favoriteCount}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
            <Text style={styles.bookGridTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.bookGridAuthor} numberOfLines={1}>{author}</Text>
        </TouchableOpacity>
    );
};

// Floating App Canvas Variation
const createLocalStyles = (theme) => StyleSheet.create({
    favoriteButton: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: theme.background, 
        borderRadius: 16,
        height: 30,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        zIndex: 10,
        shadowColor: theme.shadowBase,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 3,
        elevation: 4,
    },
    favoriteCountText: {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16,
    }
});
