import { StyleSheet } from 'react-native';
import { Spacing, Fonts } from '@readme/shared/src/constants/theme';

export const buildStyles = (theme, colorScheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: Spacing.three,
            paddingTop: 70,
            paddingBottom: Spacing.three,
        },
        backButton: {
            width: 32,
            height: 32,
            justifyContent: 'center',
        },
        headerTitle: {
            flex: 1,
            textAlign: 'center',
            fontSize: 20,
            fontFamily: Fonts.inter_bold,
            color: theme.text,
            marginRight: 32, // balances backButton width so the title stays visually centered
        },
        scrollContent: {
            paddingHorizontal: Spacing.three,
            paddingBottom: Spacing.five,
        },
        countLabel: {
            fontSize: 13,
            fontFamily: Fonts.inter_bold,
            color: theme.secondary,
            letterSpacing: 0.5,
            marginBottom: Spacing.two,
        },
        description: {
            fontSize: 14,
            fontFamily: Fonts.inter_regular,
            color: theme.subtext,
            lineHeight: 20,
            marginBottom: Spacing.four,
        },
        listCard: {
            borderRadius: 16,
            overflow: 'hidden',
        },
        userRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: Spacing.three,
            paddingHorizontal: Spacing.three,
        },
        userRowBorder: {
            borderBottomWidth: 1,
            borderBottomColor: theme.backgroundSelected,
        },
        userRowLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.three,
        },
        avatarPlaceholder: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: theme.backgroundSelected,
            overflow: 'hidden',
        },
        avatarImage: {
            width: '100%',
            height: '100%',
        },
        fullName: {
            fontSize: 15,
            fontFamily: Fonts.inter_semi,
            color: theme.text,
            marginBottom: 2,
        },
        username: {
            fontSize: 14,
            fontFamily: Fonts.inter_regular,
            color: theme.subtext,
        },
        emptyText: {
            paddingVertical: Spacing.four,
            textAlign: 'center',
            color: theme.subtext,
            fontFamily: Fonts.inter_regular,
        },
    });