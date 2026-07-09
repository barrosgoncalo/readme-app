import { StyleSheet } from 'react-native';

export const buildStyles = (theme) => StyleSheet.create({
    tabButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 20,
        marginTop: 16,
        marginBottom: 12,
    },
    pillButton: {
        paddingVertical: 10,
        paddingHorizontal: 44,
        borderRadius: 100,
        backgroundColor: theme.pillButtonMuted,
    },
    tabButtonActive: {
        backgroundColor: theme.pillButtonActive,
    },
    tabButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.pillButtonMutedText,
    },
    tabButtonTextActive: {
        color: theme.pillButtonActiveText,
    },
    container: {
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.backgroundElement,
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 48,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: theme.text,
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.borderLight,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.iconBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    resultTextContainer: {
        flex: 1,
    },
    bookTextContainer: {
        flex: 1,
    },
    resultUsername: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text,
    },
    resultFullName: {
        fontSize: 13,
        color: theme.subtext,
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
        width: '100%',
    },
    emptyStateText: {
        fontSize: 14,
        color: theme.subtext,
        marginTop: 10,
    },

    // --- inline publication results grid (shown once a book title is picked) ---
    listContent: {
        paddingBottom: 40,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    card: {
        width: '48%',
        backgroundColor: theme.backgroundElement,
        borderRadius: 16,
        padding: 10,
    },
    coverWrapper: {
        width: '100%',
        aspectRatio: 3 / 4,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 10,
        backgroundColor: theme.iconBg,
    },
    coverImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    coverPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.text,
        lineHeight: 18,
    },
    cardAuthor: {
        fontSize: 12,
        color: theme.subtext,
        marginTop: 4,
    },
    cardSeller: {
        fontSize: 12,
        color: theme.subtext,
        marginTop: 2,
    },

    // --- Google-style numbered pagination footer ---
    footerWrapper: {
        marginTop: 8,
    },
    paginationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 16,
    },
    pageArrow: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageNumberActive: {
        backgroundColor: theme.pillButtonActive,
    },
    pageNumberText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.subtext,
    },
    pageNumberTextActive: {
        color: theme.pillButtonActiveText,
    },
});