import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { Colors } from '@readme/shared/src/constants/theme';

import QRCode from 'react-native-qrcode-svg';

export default function SwapQRCodeScreen({ route, navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { verificationCode } = route.params;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.textItemTitle }]}>Código de Swap</Text>
                <View style={{ width: 32 }} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.textItemTitle }]}>O teu código de validação</Text>
                <Text style={[styles.subtitle, { color: theme.subtext }]}>
                    Mostra este código ao outro swapper para que ele o possa ler e concluir a troca.
                </Text>

                {/* QR Container */}
                <View style={[styles.qrContainer, { backgroundColor: '#FFFFFF', borderColor: theme.borderLight }]}>
                    <QRCode 
                        value={verificationCode} 
                        size={200}
                        color="#1C1A19" // A tua cor de texto escura
                        backgroundColor="#FFFFFF"
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56 },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 16, fontWeight: '700' },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 56 },
    title: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 20 },
    qrContainer: { padding: 20, borderRadius: 24, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    qrPlaceholder: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
    qrRawText: { fontSize: 13, fontWeight: '600', marginTop: 12, color: '#4A4A4A', letterSpacing: 1 }
});
