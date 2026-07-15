import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { useSwapScanner } from '@readme/shared/src/hooks/use-swap-scanner';
import { buildSwapScannerStyles } from '../../../styles/swapScannerScreenStyles'; 

export default function SwapScannerScreen({ route, navigation }) {
    const { messageId, chatId } = route.params;
    
    const theme = useTheme();
    const styles = buildSwapScannerStyles(theme);

    const [permission, requestPermission] = useCameraPermissions();
    const {
        isVerifying,
        scanned,
        handleBarCodeScanned,
    } = useSwapScanner(chatId, messageId, navigation);

    if (!permission) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Text style={styles.instructions}>
                        We need access to your camera to scan the QR code.
                    </Text>

                    <TouchableOpacity
                        style={[styles.backButton, { padding: 12, backgroundColor: theme.primary || '#E58A1F', borderRadius: 8 }]}
                        onPress={requestPermission}
                    >
                        <Text style={[styles.backButtonText, { fontWeight: '600' }]}>Grant Permission</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={
                    scanned || isVerifying
                        ? undefined
                        : handleBarCodeScanned
                }
            />

            <SafeAreaView style={styles.overlayContainer}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.closeButton}
                    >
                        <Iconify
                            icon="lucide:x"
                            size={24}
                            color="#FFFFFF"
                        />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>
                        Scan Swap Code
                    </Text>

                    <View style={styles.headerSpacer} />
                </View>

                <View style={styles.viewfinderContainer}>
                    <Text style={styles.instructions}>
                        Align the QR code inside the square
                    </Text>

                    <View style={styles.viewfinderFrame}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />

                        {isVerifying && (
                            <ActivityIndicator
                                size="large"
                                color="#FFFFFF"
                            />
                        )}
                    </View>
                </View>

                <View style={styles.bottomBar}>
                    {scanned && !isVerifying && (
                        <Text style={styles.instructions}>
                            Processing code...
                        </Text>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}
