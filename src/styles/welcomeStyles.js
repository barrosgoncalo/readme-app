import { StyleSheet } from 'react-native';

export const buildStyles = (theme, colorScheme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background, // Keeps it dynamic for dark mode!
    },
    
    // ─── IMAGE SECTION ───
    imageContainer: {
        flex: 1.2, // Takes up slightly more than half the screen
        width: '100%',
    },
    image: {
        width: '100%',
        height: '100%',
    },

    // ─── CONTENT SECTION ───
    contentContainer: {
        flex: 1,
        backgroundColor: theme.background,
        paddingHorizontal: 30,
        paddingTop: 40,
        paddingBottom: 20,
        justifyContent: 'space-between', // Pushes text up and buttons down
    },
    textWrapper: {
        marginBottom: 20,
    },
    title: {
        fontSize: 40,
        fontWeight: 'bold',
        color: theme.text,
        lineHeight: 48,
        marginBottom: 20,
        // fontFamily: 'Your-Serif-Font', // Uncomment this once you load your custom Figma font!
    },
    subtitle: {
        fontSize: 16,
        color: colorScheme === 'dark' ? '#CCCCCC' : '#4A4A4A',
        lineHeight: 24,
    },

    // ─── BUTTONS ───
    buttonWrapper: {
        width: '100%',
        paddingBottom: 10,
    },
    primaryButton: {
        backgroundColor: '#3B3561',
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
        color: '#3B3561', // Use the same purple as the button background
        fontSize: 15,
        fontWeight: '600',
    },
});
