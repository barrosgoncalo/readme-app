import { StyleSheet } from 'react-native';

export const buildBookListStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: '100%',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center'
    },
    warningIconContainer: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 50,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 8
    },
    modalSubtitle: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginBottom: 20,
        lineHeight: 20
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        marginBottom: 24,
        textAlign: 'center'
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between'
    },
    actionButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center'
    },
    cancelButton: {
        backgroundColor: 'transparent',
        marginRight: 8
    },
    saveButton: {
        marginLeft: 8
    },
    deleteButton: {
        backgroundColor: '#EF4444',
        marginLeft: 8
    },
    buttonText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold'
    }
});
