import { StyleSheet } from 'react-native';
import { Fonts } from '@readme/shared/src/constants/theme';
import { buildBookGridStyles } from './bookGridStyles';

export const buildExploreStyles = (theme) => {
    const gridStyles = buildBookGridStyles(theme);

    return StyleSheet.create({
        ...gridStyles,

        // --- Header ---
        headerContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingHorizontal: 24,
            paddingTop: 80,
            paddingBottom: 15,
            position: 'relative',
        },

        headerActions: {
            position: 'absolute',
            right: 12,
            top: 82,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            zIndex: 10,
        },

        headerTitle: {
            fontSize: 28,
            fontWeight: 'bold',
            paddingBottom: 5,
            color: theme.textDisplay,
        },
        headerSubtitle: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.secondary,
            marginTop: 2,
            fontFamily: Fonts.inter_bold
        },
        searchButton: {
            padding: 5,
        },

        swapSectionContainer: {
            backgroundColor: 'transparent',
            borderRadius: 20,
            paddingVertical: 10,
            marginBottom: 24,
            overflow: 'hidden',
        },
        swapList: {
            gap: 16,
            paddingHorizontal: 28,
            paddingTop: 12,
            paddingBottom: 12,
        },

        // --- Floating Nav Bar ---
        navBarContainer: {
            position: 'absolute',
            bottom: 30,
            alignSelf: 'center',
            backgroundColor: theme.tabBarBackground,
            borderRadius: 40,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 8,
            paddingHorizontal: 12,
            width: '85%',
            height: 64,
            shadowColor: theme.shadowBase,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 10,
            elevation: 8,
        },
        navTabActive: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.tabBarPillActive,
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 30,
            gap: 8,
        },
        navTextActive: {
            color: theme.tabBarTextActive,
            fontSize: 16,
            fontWeight: '600',
        },
        navTabInactive: {
            paddingVertical: 12,
            paddingHorizontal: 24,
        },

        // SwapCard
        swapCardWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            padding: 14,
            borderRadius: 18,
            backgroundColor: theme.headerBackground, // same brown as swapSectionContainer
            width: 190,
            marginRight: 14,
        },
        swapCardThumbnail: {
            width: 80,
            height: 80,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: theme.backgroundElement, // placeholder tint while image loads
        },
        swapCardImage: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
        },
        avatarChip: {
            position: 'absolute',
            top: -12,
            left: -12,
            width: 42,
            height: 42,
            borderRadius: 21,
            overflow: 'hidden',
            borderWidth: 2.5,
            zIndex: 2,
        },
        statusBadge: {
            position: 'absolute',
            bottom: -5,
            right: -5,
            width: 26,
            height: 26,
            borderRadius: 13,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
        },
        filterButton: {
            width: 30,
            height: 30,
            borderRadius: 20,
            backgroundColor: theme.pillButtonMuted,
            alignItems: 'center',
            justifyContent: 'center',
        },
        filterButtonActive: {
            backgroundColor: theme.pillButtonActive,
        },
        filterBadgeDot: {
            position: 'absolute',
            top: 6,
            right: 6,
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: theme.secondary,
        },

        // --- filter/sort modal ---
        modalOverlay: {
            flex: 1,
            justifyContent: 'flex-end',
        },
        modalBackdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.4)',
        },
        modalSheet: {
            backgroundColor: theme.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '75%',
            paddingHorizontal: 20,
            paddingBottom: 24,
        },
        modalHandle: {
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.borderLight,
            alignSelf: 'center',
            marginTop: 10,
            marginBottom: 6,
        },
        modalHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 14,
        },
        modalTitle: {
            fontSize: 17,
            fontWeight: '700',
            color: theme.text,
        },
        modalScroll: {
            maxHeight: 420,
        },
        modalSectionLabel: {
            fontSize: 13,
            fontWeight: '700',
            color: theme.subtext,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 8,
        },
        modalOptionRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 10,
        },
        modalOptionText: {
            fontSize: 15,
            color: theme.text,
        },
        modalOptionTextActive: {
            fontWeight: '600',
            color: theme.secondary,
        },
        modalFooter: {
            flexDirection: 'row',
            gap: 12,
            paddingTop: 16,
        },
        modalResetButton: {
            flex: 1,
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: 'center',
            backgroundColor: theme.pillButtonMuted,
        },
        modalResetText: {
            fontSize: 15,
            fontWeight: '600',
            color: theme.pillButtonMutedText,
        },
        modalApplyButton: {
            flex: 1,
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: 'center',
            backgroundColor: theme.pillButtonActive,
        },
        modalApplyText: {
            fontSize: 15,
            fontWeight: '600',
            color: theme.pillButtonActiveText,
        },

    });
};
