import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { ChatService } from '@readme/shared/src/services/chat';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function SwapScannerScreen({ route, navigation }) {
    const { 
        messageId, 
        chatId, 
    } = route.params;
    
    const [isVerifying, setIsVerifying] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const isProcessingRef = useRef(false);

    const handleVerifySuccess = async (scannedCode) => {
        setIsVerifying(true);
        try {
            // Send the scanned code to the Cloud Function
            await ChatService.verifySwapCode(chatId, messageId, scannedCode);
            
            // If we reach this line, the Cloud Function succeeded and updated the DB!
            Alert.alert("Sucesso!", "Troca verificada com sucesso! Os livros foram removidos da plataforma.", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error("Erro ao validar o swap:", error);
            Alert.alert(
                "Verificação Falhou", 
                "O código lido é inválido ou ocorreu um erro.", 
                [{ 
                    text: "Tentar Novamente", 
                    onPress: () => {
                        setScanned(false);
                        isProcessingRef.current = false; 
                    } 
                }]
            );
        } finally {
            setIsVerifying(false);
        }
    };

    // ... (rest of your component remains exactly the same!)
    const handleBarCodeScanned = ({ data }) => {
        if (isProcessingRef.current) return; 
        
        isProcessingRef.current = true; 
        console.log("QR Code scanned data:", data);
        
        setScanned(true); 
        handleVerifySuccess(data);
    };

    if (!permission) {
        return <View style={styles.container}><ActivityIndicator size="large" color="#FFFFFF" /></View>;
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Text style={styles.instructions}>Precisamos de acesso à câmara para ler o QR Code.</Text>
                    <Button title="Dar Permissão" onPress={requestPermission} />
                    <TouchableOpacity style={{marginTop: 20}} onPress={() => navigation.goBack()}>
                        <Text style={{color: '#FFF'}}>Voltar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
                onBarcodeScanned={scanned || isVerifying ? undefined : handleBarCodeScanned}
            />

            <SafeAreaView style={styles.overlayContainer}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                        <Iconify icon="lucide:x" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Ler Código de Swap</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.viewfinderContainer}>
                    <Text style={styles.instructions}>Alinha o código QR dentro do quadrado</Text>
                    
                    <View style={styles.viewfinderFrame}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                        
                        {isVerifying && <ActivityIndicator size="large" color="#FFFFFF" />}
                    </View>
                </View>

                <View style={styles.bottomBar}>
                    {scanned && !isVerifying && (
                         <Text style={styles.instructions}>A processar código...</Text>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    overlayContainer: { flex: 1 }, 
    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56, backgroundColor: 'rgba(0,0,0,0.5)' },
    closeButton: { padding: 8 },
    headerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    viewfinderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
    instructions: { color: '#FFFFFF', fontSize: 14, marginBottom: 24, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 4 },
    viewfinderFrame: { width: 240, height: 240, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    corner: { position: 'absolute', width: 24, height: 24, borderColor: '#FFFFFF' },
    topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
    topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
    bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
    bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
    bottomBar: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, alignItems: 'center' },
});
