import { StyleSheet } from 'react-native';
import { Fonts } from '../constants/theme';

export const buildStyles = (theme, colorScheme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background, // Keeps it dynamic for dark mode!
    },
    
    // ─── IMAGE SECTION ───
    imageContainer: {
        flex: 1.2,
        width: '100%',
        overflow: 'hidden',
    },
    image: {
        width: '120%',
        height: '100%',
        transform: [{ translateX: -55 }],
    },

    // ─── CONTENT SECTION ───
    contentContainer: {
        flex: 1,
        backgroundColor: theme.background,
        paddingHorizontal: 30,
        paddingTop: 40,
        paddingBottom: 20,
        justifyContent: 'space-between',
    },
    textWrapper: {
        marginBottom: 20,
    },
    title: {
        fontSize: 40,
        color: theme.text,
        lineHeight: 48,
        marginBottom: 20,
        fontFamily: Fonts.playfair_bold,
    },
    subtitle: {
        fontSize: 16,
        color: colorScheme === 'dark' ? '#CCCCCC' : '#4A4A4A',
        lineHeight: 24,
        fontFamily: Fonts.inter_regular,
    },

    // ─── BUTTONS ───
    buttonWrapper: {
        width: '100%',
        paddingBottom: 10,
    },
    primaryButton: {
        backgroundColor: theme.quaternary,
        borderRadius: 30,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    arrowIcon: {
        marginLeft: 8,
    },
    secondaryButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: theme.quaternary,
        fontSize: 15,
        fontWeight: '600',
    },
});
