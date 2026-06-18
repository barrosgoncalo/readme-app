import { Platform, StyleSheet } from 'react-native';
import { Colors } from '@readme/shared/src/constants/theme';

export const buildStyles = (theme) => StyleSheet.create({
    root: {
        flex: 1,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 56 : 20,
        paddingBottom: 12,
        backgroundColor: theme.background,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
        fontFamily: Platform.select({ ios: 'Inter-Bold', default: 'Inter-Bold' }),
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
        fontFamily: Platform.select({ ios: 'Inter-Regular', default: 'Inter-Regular' }),
    },
    fieldLabelHighlighted: {
        color: theme.secondary,
    },

    input: {
        fontSize: 15,
        paddingVertical: 0,
        fontFamily: Platform.select({ ios: 'Inter-Regular', default: 'Inter-Regular' }),
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
        fontFamily: Platform.select({ ios: 'Inter-Bold', default: 'Inter-Bold' }),
    },
    submitTextDisabled: {
        color: theme.subtext,
    },
});