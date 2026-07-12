import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    Button,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSwapScanner } from '@readme/shared/src/hooks/use-swap-scanner';

export default function SwapScannerScreen({ route, navigation }) {
    const { messageId, chatId } = route.params;

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

                    <Button
                        title="Grant Permission"
                        onPress={requestPermission}
                    />

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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },

    overlayContainer: {
        flex: 1,
    },

    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 56,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },

    closeButton: {
        padding: 8,
    },

    headerTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },

    headerSpacer: {
        width: 40,
    },

    viewfinderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 40,
    },

    instructions: {
        color: '#FFFFFF',
        fontSize: 14,
        marginBottom: 24,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: {
            width: 0,
            height: 1,
        },
        textShadowRadius: 4,
    },

    viewfinderFrame: {
        width: 240,
        height: 240,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },

    corner: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderColor: '#FFFFFF',
    },

    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 3,
        borderLeftWidth: 3,
    },

    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 3,
        borderRightWidth: 3,
    },

    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 3,
        borderLeftWidth: 3,
    },

    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 3,
        borderRightWidth: 3,
    },

    bottomBar: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        alignItems: 'center',
    },

    backButton: {
        marginTop: 20,
    },

    backButtonText: {
        color: '#FFFFFF',
    },
});
