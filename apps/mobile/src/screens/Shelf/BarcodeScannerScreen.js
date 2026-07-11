import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Modal,
    Image,
    Alert,
    useColorScheme
} from 'react-native';
import { buildBarcodeScannerStyles } from '../../styles/barcodeScannerStyles';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Iconify } from 'react-native-iconify';

import { ROUTES } from '@readme/shared/src/constants/routes';
import { Colors } from '@readme/shared/src/constants/theme';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';

// ─── SERVICES & MODELS ──────────
import { GoogleBooksService } from '@readme/shared/src/services/googleBooks';
import { GlobalBooksService } from '@readme/shared/src/services/books';
import { MyBooksService } from '@readme/shared/src/services/books';

export default function BarcodeScannerScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { currentUser } = useAuth();
    const styles = buildBarcodeScannerStyles();

    // ─── State ───────────────────────────────────────────────────────────────
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);

    // Modal & Result State
    const [modalVisible, setModalVisible] = useState(false);
    const [scannedBook, setScannedBook] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const isProcessing = useRef(false);

    // ─── Permissions ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission]);

    if (!permission) {
        return <View style={{ flex: 1, backgroundColor: theme.background }} />;
    }

    if (!permission.granted) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
                <Text style={{ color: theme.text, marginBottom: 20 }}>
                    We need your permission to show the camera
                </Text>
                <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
                    <Text style={styles.primaryButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ─── Handlers ────────────────────────────────────────────────────────────
    const handleBarCodeScanned = async ({ type, data }) => {
        if (isProcessing.current) return;
        isProcessing.current = true;

        setScanned(true);
        setLoading(true);

        try {
            let bookResult = await GlobalBooksService.getBookByIsbn(data);

            if (!bookResult) {
                bookResult = await GoogleBooksService.getBookByIsbn(data);
            }

            setScannedBook(bookResult);
            setModalVisible(true);
            setLoading(false);

        } catch (error) {
            console.error("Scanning process error:", error);
            
            Alert.alert(
                "Error", 
                "Could not find book or connect to database. Please try again.",
                [{ 
                    text: "OK", 
                    onPress: () => {
                        setScanned(false);
                        isProcessing.current = false;
                    }
                }]
            );
            setLoading(false);
        }
    };

    const handleSaveBook = async () => {
        if (!scannedBook) return;
        setIsSaving(true);

        try {
            await MyBooksService.saveBookToShelf(currentUser.uid, scannedBook, 'reading');

            Alert.alert(
                'Success!', 
                `"${scannedBook.title}" has been added to your shelf.`, 
                [{ text: 'OK', onPress: () => navigation.popToTop() }]
            );

        } catch (error) {
            console.error("Firestore Save Error:", error);
            Alert.alert("Error", "Failed to save the book to your shelf.");
        } finally {
            setIsSaving(false);
        }
    };

    const resetScanner = () => {
        setModalVisible(false);
        setScannedBook(null);
        setTimeout(() => setScanned(false), 500); 
    };

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <View style={[styles.root, { backgroundColor: theme.background }]}>

            {/* ── Header ── */}
            <View style={[styles.header, { backgroundColor: theme.background }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Scan Barcode</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* ── Camera View ── */}
            <View style={styles.cameraContainer}>
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    barcodeScannerSettings={{
                        barcodeTypes: ["ean13", "ean8", "upc_e", "upc_a"],
                    }}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                />

                {/* ── Scanner Overlay ── */}
                <View style={styles.overlay}>
                    <View style={styles.scanTarget}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                    </View>
                    <Text style={styles.instructionText}>
                        Center the barcode inside the frame
                    </Text>
                </View>

                {/* ── Loading Overlay ── */}
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#F58B2E" />
                        <Text style={styles.loadingText}>Fetching book data...</Text>
                    </View>
                )}
            </View>

            {/* ── Result Modal ── */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={resetScanner}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background || '#FFF' }]}>
                        <View style={styles.modalHeaderIndicator} />

                        {scannedBook ? (
                            <>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>Book Found!</Text>

                                <View style={styles.bookPreviewContainer}>
                                    {scannedBook.coverUrl ? (
                                        <Image source={{ uri: scannedBook.coverUrl }} style={styles.bookCover} />
                                    ) : (
                                            <View style={[styles.bookCover, styles.placeholderCover]}>
                                                <Iconify icon="lucide:book" size={32} color="#999" />
                                            </View>
                                        )}
                                    <View style={styles.bookDetails}>
                                        <Text style={[styles.bookTitle, { color: theme.text }]} numberOfLines={2}>
                                            {scannedBook.title}
                                        </Text>
                                        <Text style={styles.bookAuthor} numberOfLines={1}>
                                            {scannedBook.authors?.join(', ') || 'Unknown Author'}
                                        </Text>
                                        <Text style={styles.bookPages}>
                                            {scannedBook.pageCount > 0 ? `${scannedBook.pageCount} pages` : 'Unknown pages'}
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity 
                                    style={styles.primaryButton} 
                                    onPress={handleSaveBook}
                                    disabled={isSaving}
                                >
                                    {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Add to Shelf</Text>}
                                </TouchableOpacity>
                            </>
                        ) : (
                                <>
                                    <Text style={[styles.modalTitle, { color: theme.text }]}>Book Not Found</Text>
                                    <Text style={[styles.errorText, { color: theme.subtext }]}>
                                        We couldn't find this ISBN in the database.
                                    </Text>

                                    <TouchableOpacity style={styles.primaryButton} onPress={() => {
                                        setModalVisible(false);
                                        navigation.navigate(ROUTES.SEARCH_BOOK);
                                    }}>
                                        <Text style={styles.primaryButtonText}>Enter Details Manually</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                        <TouchableOpacity 
                            style={[styles.cancelOption, { backgroundColor: theme.backgroundElement }]} 
                            onPress={resetScanner}
                            disabled={isSaving}
                        >
                            <Text style={[styles.cancelOptionText, { color: theme.textMuted }]}>
                                {scannedBook ? "Cancel" : "Scan Again"}
                            </Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>
        </View>
    );
}
