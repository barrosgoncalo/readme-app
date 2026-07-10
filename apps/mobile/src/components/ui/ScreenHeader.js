import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';

export default function ScreenHeader({ title, onBack, theme, style, borderBottom = false }) {
    return (
        <SafeAreaView
            edges={['top']}
            style={[
                styles.header,
                { backgroundColor: theme.background },
                borderBottom && { borderBottomWidth: 1, borderBottomColor: theme.borderLight },
                style,
            ]}
        >
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.textItemTitle }]}>{title}</Text>
            <View style={{ width: 24 }} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, paddingTop: 12 },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
});
