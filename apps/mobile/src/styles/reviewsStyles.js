import { StyleSheet } from 'react-native';
import { Fonts } from '@readme/shared/src/constants/theme';

export const buildReviewsStyles = (theme) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        centerAll: {
            justifyContent: 'center',
            alignItems: 'center'
        },
        navHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingBottom: 12,
            backgroundColor: theme.background,
        },
        backButton: {
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'flex-start',
        },
        headerTitle: {
            fontSize: 18,
            fontFamily: Fonts.inter_semi || 'System',
            fontWeight: '700',
            color: theme.textItemTitle,
        },
        listContent: {
            paddingHorizontal: 20,
            paddingBottom: 40,
        },
        aggregateContainer: {
            alignItems: 'center',
            paddingVertical: 32,
            marginBottom: 16,
        },
        aggregateScore: {
            fontSize: 64,
            fontFamily: Fonts.inter_bold || 'System',
            fontWeight: '800',
            color: theme.textDisplay,
            marginBottom: 8,
            letterSpacing: -1,
        },
        aggregateSubtitle: {
            marginTop: 14,
            fontSize: 16,
            fontFamily: Fonts.inter_medium || 'System',
            color: theme.textMuted || '#999999',
        },
        reviewCard: {
            backgroundColor: theme.cardBackground || '#FFFFFF',
            padding: 16,
            borderRadius: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.borderLight || '#F0F0F0',
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.03,
            shadowRadius: 4,
            elevation: 2,
        },
        reviewHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
        },
        reviewAuthor: {
            fontFamily: Fonts.inter_semi || 'System',
            fontWeight: '600',
            fontSize: 15,
            color: theme.textItemTitle || '#1C1C1E',
        },
        reviewText: {
            fontFamily: Fonts.inter_regular || 'System',
            fontSize: 14,
            lineHeight: 22,
            color: theme.subtext || '#666666',
            marginBottom: 12,
        },
        reviewDate: {
            fontFamily: Fonts.inter_regular || 'System',
            fontSize: 12,
            color: theme.textMuted || '#999999',
            textAlign: 'right',
        },
        emptyStateContainer: {
            paddingTop: 100,
            alignItems: 'center',
            justifyContent: 'center',
        },
        emptyStateText: {
            fontFamily: Fonts.inter_regular || 'System',
            color: theme.textMuted || '#999999',
            fontSize: 15,
            marginTop: 16,
        },
    });
};
