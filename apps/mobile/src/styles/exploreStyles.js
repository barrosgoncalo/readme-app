import { StyleSheet } from 'react-native';
import { Spacing, Fonts, Colors } from '@readme/shared/src/constants/theme';

export const buildStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    scrollContent: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 120, // leaves room for the floating tab bar
    },

    // --- Header ---
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 26,
        fontWeight: '700',
        color: theme.textDisplay,
    },
    subGreeting: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.secondary,
        marginTop: 4,
    },
    searchButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // --- Swap activity carousel ---
    activityPanel: {
        backgroundColor: theme.headerBackground,
        borderRadius: 28,
        paddingVertical: 18,
        paddingHorizontal: 14,
        marginBottom: 28,
    },
    activityCard: {
        width: 72,
        height: 96,
        borderRadius: 12,
        marginRight: 12,
    },
    activityCover: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        resizeMode: 'cover',
    },
    statusDot: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: theme.headerBackground,
    },

    // --- Discover grid ---
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    bookCard: {
        width: '48%',
        marginBottom: 24,
    },
    bookCover: {
        width: '100%',
        height: 200,
        borderRadius: 18,
        resizeMode: 'cover',
        marginBottom: 8,
        backgroundColor: theme.coverPlaceholder,
    },
    bookTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.textItemTitle,
    },
    bookAuthor: {
        fontSize: 12,
        color: theme.textAuthor,
        marginTop: 2,
    },
});