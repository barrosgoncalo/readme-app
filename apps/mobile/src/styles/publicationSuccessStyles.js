// src/styles/publicationSuccessStyles.js
import { StyleSheet } from 'react-native';
import { Fonts } from '@readme/shared/src/constants/theme';

export const buildPublicationSuccessStyles = (theme) => StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: '#00000060',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: theme.backgroundElement, 
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingBottom: 30,
        alignItems: 'center',
        marginTop: 80,
    },
    successImage: {
        width: 250,
        height: 220,
        marginTop: -120,
        resizeMode: 'contain',
        marginBottom: 10,
    },
    gradientMaskContainer: {
        height: 50,
        width: '100%',
        marginBottom: 8,
    },
    maskElementContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradientFill: {
        flex: 1,
    },
    successTitle: {
        fontSize: 30,
        fontWeight: '900',
        color: '#FFA500', 
        letterSpacing: 0,
        marginBottom: 16,
        fontFamily: Fonts.inter_semi,
        lineHeight: 45,
    },
    successSubtitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text, 
        marginBottom: 2,
    },
    successBookName: {
        fontSize: 14,
        color: theme.subtext,
        textDecorationLine: 'underline',
        marginBottom: 16,
    },
    successMessage: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.text, 
        marginBottom: 24,
    },
    homeButton: {
        flexDirection: 'row',
        backgroundColor: theme.quaternary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        gap: 10,
        width: '80%',
        justifyContent: 'center',
    },
    homeButtonText: {
        color: '#FFFFFF', 
        fontSize: 16,
        fontWeight: '700',
    },
});
