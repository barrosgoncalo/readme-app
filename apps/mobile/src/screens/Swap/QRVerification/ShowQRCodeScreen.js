import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import QRCode from 'react-native-qrcode-svg';

import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { useSwapVerification } from '@readme/shared/src/hooks/use-swap-verification';
import { buildShowQrCodeStyles } from '../../../styles/showQRCodeScreenStyles';

export default function ShowQRCodeScreen({ route, navigation }) {
    const theme = useTheme();
    const styles = buildShowQrCodeStyles(theme);
    
    const { verificationCode, chatId, messageId } = route.params;

    useSwapVerification(chatId, messageId, navigation);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Código de Swap</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.title}>O teu código de validação</Text>
                <Text style={styles.subtitle}>
                    Mostra este código ao outro swapper para que ele o possa ler e concluir a troca.
                </Text>

                {/* QR Container */}
                <View style={styles.qrContainer}>
                    <QRCode 
                        value={verificationCode} 
                        size={200}
                        color="#1C1A19" 
                        backgroundColor="#FFFFFF"
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}
