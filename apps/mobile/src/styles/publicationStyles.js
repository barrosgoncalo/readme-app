import { StyleSheet } from 'react-native';

export const buildPublicationStyles = (theme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F4F4F4',
    },
    container: {
        flex: 1,
    },
    mainContent: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
        justifyContent: 'space-between',
    },
    topFieldsContainer: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '600',
        color: '#111111',
        lineHeight: 38,
    },
    closeButton: {
        padding: 4,
    },
    // Photo Upload Box
    uploadBox: {
        borderWidth: 1.5,
        borderColor: '#333333',
        borderStyle: 'dashed',
        borderRadius: 20,
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    addPhotoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 6,
    },
    addPhotoText: {
        fontSize: 16,
        fontWeight: '600',
        fontStyle: 'italic',
        color: 'F58B2E',
    },
    // Form Elements
    inputWrapper: {
        marginBottom: 16,
    },
    label: {
        fontSize: 15,
        fontWeight: '500',
        color: '#111111',
        marginBottom: 8,
    },
    inputUnderline: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#999999',
        paddingBottom: 20,
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        color: '#111111',
        paddingVertical: 0,
    },
    charCount: {
        fontSize: 11,
        color: '#888888',
        marginLeft: 8,
    },
    textArea: {
        borderWidth: 1,
        borderColor: '#CCCCCC',
        borderRadius: 8,
        padding: 12,
        height: 100,
        fontSize: 14,
        color: '#111111',
        textAlignVertical: 'top',
        backgroundColor: '#F4F4F4',
    },
    textAreaCharCount: {
        fontSize: 11,
        color: '#888888',
        textAlign: 'right',
        marginTop: 4,
    },
    dropdownContent: {
        flex: 1,
    },
    dropdownPlaceholder: {
        fontSize: 14,
        color: '#888888',
    },
    // Submit Button
    submitButton: {
        backgroundColor: '#352F4E',
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
