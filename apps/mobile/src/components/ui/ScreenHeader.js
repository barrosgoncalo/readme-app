import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';

export default function ScreenHeader({
    title,
    onBack,
    theme,
    style,
    borderBottom = false,
    variant = 'centered', // 'centered' | 'large'
}) {
    const isLarge = variant === 'large';

    return (
        <SafeAreaView
            edges={['top']}
            style={[
                isLarge ? styles.headerLarge : styles.header,
                { backgroundColor: theme.background },
                borderBottom && { borderBottomWidth: 1, borderBottomColor: theme.borderLight },
                style,
            ]}
        >
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Iconify icon="lucide:arrow-left" size={24} color={isLarge ? theme.text : theme.textItemTitle} />
            </TouchableOpacity>
            <Text
                style={[
                    isLarge ? styles.headerTitleLarge : styles.headerTitle,
                    { color: isLarge ? theme.text : theme.textItemTitle },
                ]}
            >
                {title}
            </Text>
            {!isLarge && <View style={{ width: 24 }} />}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 12,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700' },

    headerLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    headerTitleLarge: { fontSize: 24, fontWeight: 'bold' },
});
