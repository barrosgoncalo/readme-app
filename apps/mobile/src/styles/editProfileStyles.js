import { Platform, StyleSheet } from 'react-native';
import { Colors } from '@readme/shared/src/constants/theme';

export const buildStyles = (theme) => StyleSheet.create({
    root: {
        flex: 1,
    },

    // Header
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

    // Scroll
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 40,
        gap: 12,
    },

    // Field box — default (no focus)
    field: {
        borderWidth: 1.5,
        borderColor: theme.backgroundSelected,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 10,
        backgroundColor: theme.backgroundElement ?? theme.background,
    },
    // Field box — focused
    fieldFocused: {
        borderColor: Colors.light.secondary,  // orange
    },

    // Label — default
    fieldLabel: {
        fontSize: 11,
        color: theme.subtext,
        marginBottom: 2,
        fontFamily: Platform.select({ ios: 'Inter-Regular', default: 'Inter-Regular' }),
    },
    // Label — focused
    fieldLabelFocused: {
        color: Colors.light.secondary,
    },

    // Input text
    input: {
        fontSize: 15,
        paddingVertical: 0,
        fontFamily: Platform.select({ ios: 'Inter-Regular', default: 'Inter-Regular' }),
    },

    // Row helpers
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowStart: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    flagBtn: {
        marginRight: 4,
    },

    // Submit — active (isDirty)
    submitBtn: {
        backgroundColor: Colors.light.primary,
        borderRadius: 10,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    // Submit — disabled (nothing changed yet)
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
});