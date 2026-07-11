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
            backgroundColor: theme.headerBackground,
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
            width: 76,
            height: 102,
            marginRight: 12,
            borderRadius: 8,
            backgroundColor: theme.backgroundElement,
        },
        swapCardImage: {
            width: '100%',
            height: '100%',
            borderRadius: 6,
            resizeMode: 'cover',
        },
        statusBadge: {
            position: 'absolute',
            top: -8,
            right: -8,
            width: 24,
            height: 24,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: theme.backgroundElement,
        },
    });
};
