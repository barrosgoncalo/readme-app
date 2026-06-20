// @readme/shared/src/screens/BarcodeScannerScreen.js
import React, { useState, useEffect } from 'react';
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
import ImageColors from 'react-native-image-colors';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Iconify } from 'react-native-iconify';

import { ROUTES } from '@readme/shared/src/constants/routes';
import { Colors } from '@readme/shared/src/constants/theme';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';

// ─── SERVICES & MODELS ──────────
import { GoogleBooksService } from '@readme/shared/src/services/googleBooks';
import { myBooksService } from '@readme/shared/src/services/books';

export default function BarcodeScannerScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { currentUser } = useAuth();

    // ─── State ───────────────────────────────────────────────────────────────
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);

    // Modal & Result State
    const [modalVisible, setModalVisible] = useState(false);
    const [scannedBook, setScannedBook] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

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
            <View style={[localStyles.centerContainer, { backgroundColor: theme.background }]}>
                <Text style={{ color: theme.text, marginBottom: 20 }}>
                    We need your permission to show the camera
                </Text>
                <TouchableOpacity style={localStyles.primaryButton} onPress={requestPermission}>
                    <Text style={localStyles.primaryButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ─── Handlers ────────────────────────────────────────────────────────────
    const handleBarCodeScanned = async ({ type, data }) => {
        if (scanned || loading) return; // Prevent multiple rapid scans

        setScanned(true);
        setLoading(true);

        try {
            // 1. Fetch data from Google Books API
            const bookResult = await GoogleBooksService.getBookByIsbn(data);

            // 2. Set the result and show the modal
            setScannedBook(bookResult);
            setModalVisible(true);

        } catch (error) {
            Alert.alert("Error", "Could not connect to the database. Please try again.");
            setScanned(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBook = async () => {
        if (!scannedBook) return;
        setIsSaving(true);

        try {
            // The service handles the color extraction automatically now!
            await myBooksService.saveBookToShelf(currentUser.uid, scannedBook, 'reading');

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
        <View style={[localStyles.root, { backgroundColor: theme.background }]}>

            {/* ── Header ── */}
            <View style={[localStyles.header, { backgroundColor: theme.background }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[localStyles.headerTitle, { color: theme.text }]}>Scan Barcode</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* ── Camera View ── */}
            <View style={localStyles.cameraContainer}>
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    barcodeScannerSettings={{
                        barcodeTypes: ["ean13", "ean8", "upc_e", "upc_a"],
                    }}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                />

                {/* ── Scanner Overlay ── */}
                <View style={localStyles.overlay}>
                    <View style={localStyles.scanTarget}>
                        <View style={[localStyles.corner, localStyles.topLeft]} />
                        <View style={[localStyles.corner, localStyles.topRight]} />
                        <View style={[localStyles.corner, localStyles.bottomLeft]} />
                        <View style={[localStyles.corner, localStyles.bottomRight]} />
                    </View>
                    <Text style={localStyles.instructionText}>
                        Center the barcode inside the frame
                    </Text>
                </View>

                {/* ── Loading Overlay ── */}
                {loading && (
                    <View style={localStyles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#F58B2E" />
                        <Text style={localStyles.loadingText}>Fetching book data...</Text>
                    </View>
                )}
            </View>

            {/* ── Result Modal ── */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={resetScanner}>
                <View style={localStyles.modalOverlay}>
                    <View style={[localStyles.modalContent, { backgroundColor: theme.background || '#FFF' }]}>
                        <View style={localStyles.modalHeaderIndicator} />

                        {scannedBook ? (
                            <>
                                <Text style={[localStyles.modalTitle, { color: theme.text }]}>Book Found!</Text>

                                <View style={localStyles.bookPreviewContainer}>
                                    {scannedBook.coverUrl ? (
                                        <Image source={{ uri: scannedBook.coverUrl }} style={localStyles.bookCover} />
                                    ) : (
                                            <View style={[localStyles.bookCover, localStyles.placeholderCover]}>
                                                <Iconify icon="lucide:book" size={32} color="#999" />
                                            </View>
                                        )}
                                    <View style={localStyles.bookDetails}>
                                        <Text style={[localStyles.bookTitle, { color: theme.text }]} numberOfLines={2}>
                                            {scannedBook.title}
                                        </Text>
                                        <Text style={localStyles.bookAuthor} numberOfLines={1}>
                                            {scannedBook.authors?.join(', ') || 'Unknown Author'}
                                        </Text>
                                        <Text style={localStyles.bookPages}>
                                            {scannedBook.pageCount > 0 ? `${scannedBook.pageCount} pages` : 'Unknown pages'}
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity 
                                    style={localStyles.primaryButton} 
                                    onPress={handleSaveBook}
                                    disabled={isSaving}
                                >
                                    {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={localStyles.primaryButtonText}>Add to Shelf</Text>}
                                </TouchableOpacity>
                            </>
                        ) : (
                                <>
                                    <Text style={[localStyles.modalTitle, { color: theme.text }]}>Book Not Found</Text>
                                    <Text style={[localStyles.errorText, { color: theme.subtext }]}>
                                        We couldn't find this ISBN in the database.
                                    </Text>

                                    <TouchableOpacity style={localStyles.primaryButton} onPress={() => {
                                        setModalVisible(false);
                                        navigation.navigate(ROUTES.SEARCH_BOOK);
                                    }}>
                                        <Text style={localStyles.primaryButtonText}>Enter Details Manually</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                        <TouchableOpacity 
                            style={[localStyles.cancelOption, { backgroundColor: theme.backgroundElement }]} 
                            onPress={resetScanner}
                            disabled={isSaving}
                        >
                            <Text style={[localStyles.cancelOptionText, { color: theme.textMuted }]}>
                                {scannedBook ? "Cancel" : "Scan Again"}
                            </Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────
const localStyles = StyleSheet.create({
    root: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, zIndex: 10 },
    headerTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter-SemiBold' },
    cameraContainer: { flex: 1, position: 'relative' },
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
    scanTarget: { width: 250, height: 150, backgroundColor: 'transparent', position: 'relative' },
    instructionText: { color: '#FFF', marginTop: 30, fontSize: 14, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    corner: { position: 'absolute', width: 30, height: 30, borderColor: '#F58B2E' },
    topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
    topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
    bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
    bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
    loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 5, paddingBottom: 120 },
    loadingText: { color: '#FFF', marginTop: 12, fontSize: 16, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 14 },
    modalHeaderIndicator: { width: 40, height: 5, backgroundColor: '#E0E0E0', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
    bookPreviewContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.03)', padding: 16, borderRadius: 16, marginBottom: 24 },
    bookCover: { width: 70, height: 105, borderRadius: 6, backgroundColor: '#EAEAEA' },
    placeholderCover: { justifyContent: 'center', alignItems: 'center' },
    bookDetails: { flex: 1, marginLeft: 16, justifyContent: 'center' },
    bookTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    bookAuthor: { fontSize: 15, color: '#666', marginBottom: 8 },
    bookPages: { fontSize: 13, color: '#999' },
    errorText: { textAlign: 'center', fontSize: 15, marginBottom: 24, paddingHorizontal: 20 },
    primaryButton: { backgroundColor: '#F58B2E', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
    primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    cancelOption: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    cancelOptionText: { fontSize: 16, fontWeight: '600' }
});
