// ReportModal.styles.ts

import { Platform, StyleSheet } from 'react-native';
import { Fonts } from '@readme/shared/src/constants/theme';

export const buildReportModalStyles = (theme) => {
    return StyleSheet.create({
        backdrop: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        keyboardContainer: {
            width: '100%',
            maxHeight: '90%',
        },
        modalContent: {
            backgroundColor: theme.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            width: '100%',
        },
        safeArea: {
            width: '100%',
        },
        header: {
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 16,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.borderLight,
        },
        headerTitle: {
            fontSize: 20,
            fontFamily: Fonts.inter_bold || 'System',
            fontWeight: '700',
            color: theme.textItemTitle,
            marginBottom: 6,
        },
        headerSubtitle: {
            fontSize: 14,
            fontFamily: Fonts.inter_regular || 'System',
            color: theme.subtext,
            lineHeight: 20,
        },
        scrollContainer: {
            maxHeight: 420,
        },
        scrollContent: {
            padding: 20,
        },
        reasonTile: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 14,
            borderRadius: 12,
            backgroundColor: theme.backgroundElement,
            borderWidth: 1.5,
            borderColor: theme.backgroundElement,
            marginBottom: 12,
        },
        iconWrapper: {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 14,
        },
        reasonTextContainer: {
            flex: 1,
            marginRight: 10,
        },
        reasonTitle: {
            fontSize: 15,
            fontFamily: Fonts.inter_semi || 'System',
            fontWeight: '600',
            color: theme.textItemTitle,
            marginBottom: 2,
        },
        reasonSubtitle: {
            fontSize: 13,
            fontFamily: Fonts.inter_regular || 'System',
            color: theme.subtext,
        },
        radioCircle: {
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: theme.borderDark,
            justifyContent: 'center',
            alignItems: 'center',
        },
        radioInnerCircle: {
            width: 10,
            height: 10,
            borderRadius: 5,
        },
        // Extra bottom breathing room now that the details text box is gone,
        // so the button footer doesn't feel like it's crowding the last tile.
        footerButtons: {
            flexDirection: 'row',
            paddingHorizontal: 20,
            paddingBottom: Platform.OS === 'android' ? 32 : 24,
            paddingTop: 20,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.borderLight,
        },
        button: {
            flex: 1,
            height: 48,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
        },
        cancelButton: {
            backgroundColor: theme.backgroundSelected,
            marginRight: 12,
        },
        cancelButtonText: {
            color: theme.subtext,
            fontSize: 16,
            fontFamily: Fonts.inter_semi || 'System',
            fontWeight: '600',
        },
        submitButton: {
            backgroundColor: theme.primary,
        },
        submitButtonDisabled: {
            backgroundColor: theme.pillButtonMuted,
        },
        submitButtonText: {
            color: theme.primaryText,
            fontSize: 16,
            fontFamily: Fonts.inter_semi || 'System',
            fontWeight: '600',
        },
    });
}