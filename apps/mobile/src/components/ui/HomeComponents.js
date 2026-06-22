import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Colors } from '@readme/shared/src/constants/theme';

export function SwapActivityCard({ styles, coverUrl, status, onPress }) {
    const dotColor = status === 'available' ? Colors.password.green : Colors.password.red;

    return (
        <TouchableOpacity style={styles.activityCard} onPress={onPress} activeOpacity={0.85}>
            <Image source={{ uri: coverUrl }} style={styles.activityCover} />
            <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
        </TouchableOpacity>
    );
}

export function BookCard({ styles, coverUrl, title, author, onPress }) {
    return (
        <TouchableOpacity style={styles.bookCard} onPress={onPress} activeOpacity={0.85}>
            <Image source={{ uri: coverUrl }} style={styles.bookCover} />
            <Text style={styles.bookTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.bookAuthor} numberOfLines={1}>{author}</Text>
        </TouchableOpacity>
    );
}