import { StyleSheet } from "react-native";

export const buildPrivacySecurityStyles = (theme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background || '#F3F3F3', // Cor de fundo do ecrã
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.text,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '400',
        color: theme.text,
        marginBottom: 8,
        marginLeft: 4,
    },
    helperText: {
        fontSize: 13,
        color: theme.subtext || '#888888',
        marginTop: 4,
        marginLeft: 4,
        marginRight: 4,
        lineHeight: 18,
    },
    menuGroup: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 30,
        backgroundColor: theme.iconBg || '#EAEAEA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyIconPlaceholder: {
        width: 18,
        height: 18,
    },
    menuItemLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
});
