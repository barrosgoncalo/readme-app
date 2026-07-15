import { StyleSheet, Dimensions } from 'react-native';
import { Fonts } from '@readme/shared/src/constants/theme';

const { width } = Dimensions.get('window');

export const buildBookDetailsStyles = (theme) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background, 
        },
        scrollContent: {
            paddingBottom: 100, 
        },
        imageContainer: {
            width: width,
            height: 450,
            backgroundColor: theme.coverPlaceholder,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            overflow: 'hidden',
            shadowColor: theme.shadowBase,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 10,
            elevation: 5,
            position: 'relative',
        },
        singleImageWrapper: {
            width: width,
            height: 450,
            justifyContent: 'center',
            alignItems: 'center',
        },
        bookImage: {
            width: '100%',
            height: '100%',
        },
        paginationContainer: {
            position: 'absolute',
            bottom: 16,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
        },
        dot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.textProgress, // Subdued transparent color
            marginHorizontal: 4,
        },
        activeDot: {
            backgroundColor: theme.textItemTitle,
            width: 10,
            height: 10,
        },
        topButtonsContainer: {
            position: 'absolute',
            top: 5,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            zIndex: 10,
        },
        iconButton: {
            width: 44,
            height: 44,
            backgroundColor: theme.headerBackground,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: 0.9,
            marginBottom: 10,
        },
        detailsContainer: {
            paddingHorizontal: 20,
            paddingTop: 24,
        },
        title: {
            fontFamily: Fonts.playfair_bold,
            fontSize: 26,
            color: theme.textDisplay,
            marginBottom: 8,
            textTransform: 'capitalize',
            letterSpacing: 0.5,
        },
        author: {
            fontFamily: Fonts.inter_regular,
            fontSize: 18,
            color: theme.textAuthor,
            marginBottom: 20,
        },
        description: {
            fontFamily: Fonts.inter_regular,
            fontSize: 15,
            lineHeight: 22,
            color: theme.subtext,
            marginBottom: 24,
        },
        infoBoxesContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 24,
            marginTop: 5,
        },
        infoBox: {
            flex: 1,
            borderWidth: 1,
            borderColor: theme.borderDark,
            borderRadius: 8,
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
        },
        infoBoxLabel: {
            position: 'absolute',
            top: -10, 
            left: 16,
            backgroundColor: theme.background,
            paddingHorizontal: 6,
            fontFamily: Fonts.inter_semi,
            fontSize: 14,
            color: theme.textItemTitle,
        },
        infoBoxValue: {
            fontFamily: Fonts.inter_regular,
            fontSize: 16,
            color: theme.text,
        },
        sellerCard: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.cardBackground,
            borderWidth: 1,
            borderColor: theme.borderLight,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
        },
        sellerInfoLeft: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        sellerAvatar: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: theme.avatarBgTonal,
            marginRight: 12,
        },
        sellerName: {
            fontFamily: Fonts.inter_semi,
            fontSize: 16,
            color: theme.textItemTitle,
            marginBottom: 4,
        },
        ratingContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        starIcon: {
            marginRight: 2,
        },
        reviewsCount: {
            fontFamily: Fonts.inter_regular,
            fontSize: 12,
            color: theme.textMuted,
            marginLeft: 6,
        },
        bottomBar: {
            paddingHorizontal: 24, // Gives the button nice side margins
            paddingTop: 16,
            paddingBottom: 16, // Extra breathing room before the screen edge
            backgroundColor: theme.backgroundElement || '#FFFFFF', // Ensures it covers the scrolling content
            borderTopWidth: 1,
            borderTopColor: theme.borderLight || 'rgba(0,0,0,0.05)',
            // Subtle shadow to separate it from the content above
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.04,
            shadowRadius: 12,
            elevation: 8, // For Android
        },
        buttonRow: {
            flexDirection: 'row',
            paddingHorizontal: 20,
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        chatButton: {
            flex: 1,
            borderWidth: 1,
            borderColor: theme.primary,
            borderRadius: 12,
            paddingVertical: 16,
            marginRight: 12,
            justifyContent: 'center',
            alignItems: 'center',
        },
        chatButtonText: {
            fontFamily: Fonts.inter_semi,
            fontSize: 16,
            color: theme.primary, 
        },
        offerButton: {
            width: '100%', // Fills the container (minus the 24px padding on each side)
            backgroundColor: theme.primary || '#E58A1F',
            borderRadius: 16, // A smooth squircle shape
            paddingVertical: 16,
            flexDirection: 'row', // Aligns icon and text
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8, // Space between icon and text (React Native 0.71+)
            // Glow/Shadow matching the button color for a premium pop
            shadowColor: theme.primary || '#E58A1F',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
        },
        offerButtonText: {
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: '700',
            letterSpacing: 0.5, // Slight letter spacing looks more refined
        },
    });
};
