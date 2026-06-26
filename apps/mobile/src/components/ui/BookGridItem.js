import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';

export const BookGridItem = ({ title, author, imageUrl, onPress, styles }) => {
    return (
        <TouchableOpacity 
            style={styles.bookGridWrapper} 
            activeOpacity={0.8} 
            onPress={onPress}
        >
            <View style={styles.bookCoverContainer}>
                <Image source={{ uri: imageUrl }} style={styles.bookGridImage} />
            </View>
            <Text style={styles.bookGridTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.bookGridAuthor} numberOfLines={1}>{author}</Text>
        </TouchableOpacity>
    );
};
