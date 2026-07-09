import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { Colors } from '@readme/shared/src/constants/theme';
import QRCode from 'react-native-qrcode-svg';

// Firestore imports
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';

export default function ShowQRCodeScreen({ route, navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    
    // Unpack subcollection route parameters
    const { verificationCode, chatId, messageId } = route.params;

    // --- REAL-TIME LISTEN TO NESTED OFFER STATUS ---
    useEffect(() => {
        // Safety check to ensure we have the complete subcollection path
        if (!chatId || !messageId) return;

        const db = getFirestore();
        
        // Target: chats/{chatId}/messages/{messageId}
        // Note: Change 'chats' if your root collection is named 'threads' or something else
        const messageRef = doc(db, 'chats', chatId, 'messages', messageId);

        const unsubscribe = onSnapshot(messageRef, (snapshot) => {
            if (snapshot.exists()) {
                const messageData = snapshot.data();
                const offerDetails = messageData?.offerDetails;

                if (offerDetails && (offerDetails.status === 'completed' || offerDetails.status === 'verified')) {
                    navigation.goBack();
                }
            }
        }, (error) => {
            console.error("Error listening to subcollection message updates:", error);
        });

        return () => unsubscribe();
    }, [chatId, messageId, navigation]);

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
                        color="#1C1A19" 
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
