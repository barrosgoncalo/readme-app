import { StyleSheet } from 'react-native';
import { Fonts } from '@readme/shared/src/constants/theme';

export const buildStyles = (theme) => StyleSheet.create({
    tabButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'left',
        gap: 8,
        paddingHorizontal: 10,
        marginTop: 0,
        marginBottom: 15,
    },
    pillButton: {
        paddingVertical: 6,
        paddingHorizontal: 20,
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
    // --- filter button (next to tab pills) ---
    filterButton: {
        width: 30,
        height: 30,
        borderRadius: 20,
        backgroundColor: theme.pillButtonMuted,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 'auto',
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
    recentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    recentHeaderText: {
        fontSize: 13,
        fontFamily: Fonts.inter_semi,
        color: theme.subtext,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    recentClearText: {
        fontSize: 13,
        fontFamily: Fonts.inter_medium,
        color: theme.secondary,
    },
    recentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    recentIcon: {
        marginRight: 12,
    },
    recentText: {
        flex: 1,
        fontSize: 15,
        fontFamily: Fonts.inter_regular,
        color: theme.text,
    },
    recentRemoveBtn: {
        padding: 4,
        marginLeft: 8,
    },
    separator: {
        height: 1,
        backgroundColor: theme.borderLight,
        marginHorizontal: 0,
        marginBottom: 15,
    },

});