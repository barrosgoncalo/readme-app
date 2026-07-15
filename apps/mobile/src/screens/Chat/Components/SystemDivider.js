import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SystemDivider({ action, theme }) {
    const text = action === 'banned' 
        ? 'This user was banned.' 
        : 'This user deleted his account.';

    return (
        <View style={styles.container}>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
            <Text style={[styles.text, { color: theme.textSecondary }]}>{text}</Text>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
        paddingHorizontal: 16,
    },
    line: {
        flex: 1,
        height: 1,
    },
    text: {
        marginHorizontal: 10,
        fontSize: 12,
        fontWeight: '500',
    }
});
