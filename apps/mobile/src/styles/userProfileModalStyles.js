import { StyleSheet } from 'react-native';

export const buildStyles = (theme) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    card: {
        width: '100%',
        backgroundColor: theme.cardBackground,
        borderRadius: 28,
        paddingTop: 28,
        paddingBottom: 20,
        alignItems: 'center',
    },
    avatarWrapper: {
        width: 96,
        height: 96,
        borderRadius: 48,
        overflow: 'hidden',
        backgroundColor: theme.avatarBgTonal,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    username: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.textItemTitle,
    },
    handle: {
        fontSize: 14,
        color: theme.subtext,
        marginTop: 6,
    },
    email: {
        fontSize: 14,
        color: theme.subtext,
        marginTop: 2,
        marginBottom: 16,
    },
    divider: {
        height: 1,
        width: '100%',
        backgroundColor: theme.borderLight,
        marginBottom: 18,
    },
    actionsContainer: {
        width: '100%',
        paddingHorizontal: 20,
        gap: 12,
    },
    pillButton: {
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    followButton: {
        backgroundColor: theme.followPillButton,
    },
    blockButton: {
        backgroundColor: theme.blockPillButton,
    },
    cancelButton: {
        backgroundColor: theme.cancelPillButton,
    },
    pillButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
    },
});