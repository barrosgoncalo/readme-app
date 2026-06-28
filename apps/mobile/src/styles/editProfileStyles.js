import { StyleSheet } from 'react-native';
import { Fonts } from '@readme/shared/src/constants/theme';

export const buildEditProfileStyles = (theme) => StyleSheet.create({
    root: {
        flex: 1,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 66,
        paddingBottom: 12,
        backgroundColor: theme.background,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
        fontFamily: Fonts.inter_bold,
    },

    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 40,
        gap: 12,
    },

    // Field box — default
    field: {
        borderWidth: 1.5,
        borderColor: theme.backgroundSelected,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 10,
        backgroundColor: theme.backgroundElement ?? theme.background,
    },
    // Field box — focused OR dirty
    fieldHighlighted: {
        borderColor: theme.secondary,
    },

    fieldLabel: {
        fontSize: 11,
        color: theme.subtext,
        marginBottom: 2,
        fontFamily: Fonts.inter,
    },
    fieldLabelHighlighted: {
        color: theme.secondary,
    },

    input: {
        fontSize: 15,
        paddingVertical: 0,
        fontFamily: Fonts.inter,
    },

    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowStart: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    // Submit — active
    submitBtn: {
        backgroundColor: theme.primary,
        borderRadius: 10,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    // Submit — disabled (nothing changed)
    submitBtnDisabled: {
        backgroundColor: theme.backgroundSelected,
    },
    submitText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 1.2,
        fontFamily: Fonts.inter_bold,
    },
    submitTextDisabled: {
        color: theme.subtext,
    },

    pencilButtonContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 4, 
    },
    pencilMiddleLayer: {
        backgroundColor: '#F2F0EF',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 14,
    },
    modalHeaderIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#EAEAEA',
    },
    modalOptionText: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 14,
    },
    cancelOption: {
        borderBottomWidth: 0,
        justifyContent: 'center',
        marginTop: 10,
        backgroundColor: theme.shadowBase,
        borderRadius: 12,
    },
    cancelOptionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    }
});
