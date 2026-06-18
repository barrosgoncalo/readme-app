import { StyleSheet, Platform } from 'react-native';

export const buildSuccessStyles = (theme) => StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: theme.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 20,
        justifyContent: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingBottom: 60,
    },
    iconWrapper: {
        width: 220,
        height: 220,
        borderRadius: 150, 
        backgroundColor: theme.groupShadow,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        // --- iOS Shadow ---
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        // --- Android Shadow ---
        elevation: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.text, // Substitui o #000
        textAlign: 'center',
        marginBottom: 16,
    },
    subHeading: {
        fontSize: 16,
        color: theme.subtext, // Substitui o #666
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 22,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.primary, // Substitui o #5C4033
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 12,
        gap: 10,
    },
    buttonText: {
        color: theme.primaryText,
        fontSize: 16,
        fontWeight: '600',
    },
});
