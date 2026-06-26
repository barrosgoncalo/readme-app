import { StyleSheet } from "react-native";

export const buildBarcodeScannerStyles = () => StyleSheet.create({
    root: { 
        flex: 1 
    },
    centerContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 20 
    },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        paddingTop: 60, 
        paddingBottom: 20, 
        zIndex: 10 
    },
    headerTitle: { 
        fontSize: 18, 
        fontWeight: '700', 
        fontFamily: 'Inter-SemiBold' 
    },
    cameraContainer: { 
        flex: 1, 
        position: 'relative' 
    },
    overlay: { 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0,0,0,0.4)' 
    },
    scanTarget: { 
        width: 250, 
        height: 150, 
        backgroundColor: 'transparent', 
        position: 'relative' 
    },
    instructionText: { 
        color: '#FFF', 
        marginTop: 30, 
        fontSize: 14, 
        fontWeight: '600', 
        backgroundColor: 'rgba(0,0,0,0.6)', 
        paddingHorizontal: 16, 
        paddingVertical: 8, 
        borderRadius: 20 
    },
    corner: { 
        position: 'absolute', 
        width: 30, 
        height: 30, 
        borderColor: '#F58B2E' 
    },
    topLeft: { 
        top: 0, 
        left: 0, 
        borderTopWidth: 4, 
        borderLeftWidth: 4 
    },
    topRight: { 
        top: 0, 
        right: 0, 
        borderTopWidth: 4, 
        borderRightWidth: 4 
    },
    bottomLeft: { 
        bottom: 0, 
        left: 0, 
        borderBottomWidth: 4, 
        borderLeftWidth: 4 
    },
    bottomRight: { 
        bottom: 0, 
        right: 0, 
        borderBottomWidth: 4, 
        borderRightWidth: 4 
    },
    loadingOverlay: { 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.7)', 
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 5, 
        paddingBottom: 120 
    },
    loadingText: { 
        color: '#FFF', 
        marginTop: 12, 
        fontSize: 16, 
        fontWeight: '600' 
    },
    modalOverlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0, 0, 0, 0.4)', 
        justifyContent: 'flex-end' 
    },
    modalContent: { 
        borderTopLeftRadius: 24, 
        borderTopRightRadius: 24, 
        paddingHorizontal: 24, 
        paddingBottom: 40, 
        paddingTop: 14 
    },
    modalHeaderIndicator: { 
        width: 40, 
        height: 5, 
        backgroundColor: '#E0E0E0', 
        borderRadius: 3, 
        alignSelf: 'center', 
        marginBottom: 20 
    },
    modalTitle: { 
        fontSize: 20, 
        fontWeight: '700', 
        marginBottom: 20, 
        textAlign: 'center' 
    },
    bookPreviewContainer: { 
        flexDirection: 'row', 
        backgroundColor: 'rgba(0,0,0,0.03)', 
        padding: 16, 
        borderRadius: 16, 
        marginBottom: 24 
    },
    bookCover: { 
        width: 70, 
        height: 105, 
        borderRadius: 6, 
        backgroundColor: '#EAEAEA' 
    },
    placeholderCover: { 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    bookDetails: { 
        flex: 1, 
        marginLeft: 16, 
        justifyContent: 'center' 
    },
    bookTitle: { 
        fontSize: 18, 
        fontWeight: '700', 
        marginBottom: 4 
    },
    bookAuthor: { 
        fontSize: 15, 
        color: '#666', 
        marginBottom: 8 
    },
    bookPages: { 
        fontSize: 13, 
        color: '#999' 
    },
    errorText: { 
        textAlign: 'center', 
        fontSize: 15, 
        marginBottom: 24, 
        paddingHorizontal: 20 
    },
    primaryButton: { 
        backgroundColor: '#F58B2E', 
        paddingVertical: 16, 
        borderRadius: 12, 
        alignItems: 'center', 
        marginBottom: 12 
    },
    primaryButtonText: { 
        color: '#FFF', 
        fontSize: 16, 
        fontWeight: '600' 
    },
    cancelOption: { 
        paddingVertical: 16, 
        borderRadius: 12, 
        alignItems: 'center' 
    },
    cancelOptionText: { 
        fontSize: 16, 
        fontWeight: '600' 
    }
});
