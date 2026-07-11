import { useState, useRef } from 'react';
import { Alert } from 'react-native';
import { GlobalBooksService } from '../services/books';
import { GoogleBooksService } from '../services/googleBooks';

export function useBarcodeScan() {
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [scannedBook, setScannedBook] = useState(null);
    const isProcessing = useRef(false);

    const handleBarCodeScanned = async ({ data }) => {
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
        } finally {
            setLoading(false);
        }
    };

    const resetScanner = () => {
        setModalVisible(false);
        setScannedBook(null);
        setTimeout(() => {
            setScanned(false);
            isProcessing.current = false;
        }, 500);
    };

    return {
        scanned,
        loading,
        modalVisible,
        scannedBook,
        handleBarCodeScanned,
        resetScanner,
    };
}
