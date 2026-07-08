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
        color: theme.textMuted,
    },
    tabButtonTextActive: {
        color: theme.borderLight,
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
    },
    emptyStateText: {
        fontSize: 14,
        color: theme.subtext,
        marginTop: 10,
    },
});