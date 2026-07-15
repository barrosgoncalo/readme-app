import { StyleSheet } from 'react-native';

export const buildInlineMapStyles = (theme) => StyleSheet.create({
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.textItemTitle,
        marginTop: 24,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: theme.subtext,
        marginBottom: 12,
    },
    mapWrapper: {
        height: 260,
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.borderLight,
        marginBottom: 12
    },
    map: {
        width: '100%',
        height: '100%'
    },
    actionCard: {
        padding: 14,
        borderRadius: 12,
        backgroundColor: theme.backgroundElement,
        borderWidth: 1,
        borderColor: theme.borderLight,
        marginBottom: 16
    },
    actionTextContainer: {
        marginBottom: 12
    },
    actionLocationTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.textItemTitle
    },
    actionLocationSub: {
        fontSize: 12,
        color: theme.subtext,
        marginTop: 2
    },
    actionButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    inlineProposeButton: {
        flex: 1,
        paddingVertical: 10,
        marginRight: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.primary,
        alignItems: 'center',
        justifyContent: 'center'
    },
    inlineProposeText: {
        color: theme.primary,
        fontSize: 13,
        fontWeight: '600'
    },
    inlineAcceptButton: {
        flex: 1,
        paddingVertical: 10,
        marginLeft: 6,
        borderRadius: 8,
        backgroundColor: theme.primary,
        alignItems: 'center',
        justifyContent: 'center'
    },
    inlineAcceptText: {
        color: theme.primaryText,
        fontSize: 13,
        fontWeight: '600'
    }
});
