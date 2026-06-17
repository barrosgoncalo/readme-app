import { StyleSheet } from 'react-native';
import { Spacing, Fonts, Colors } from '@readme/shared/src/constants/theme';

export const buildStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.headerBackground,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 0,
        height: 320,
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '600',
        marginBottom: 18,
    },
    avatarContainer: {
        width: 108,
        height: 108,
        borderRadius: 58,
        borderWidth: 4,
        borderColor: '#F58B2E',
        padding: 4,
        marginTop: -5,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profilePicture: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 0,
        resizeMode: 'cover',
    },
    userInfo: {
        alignItems: 'center',
    },
    userNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    userName: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '600',
    },
    userEmail: {
        fontSize: 14,
        color: '#D6D3D1',
    },
    scrollView: {
        flex: 1,
        zIndex: 1,
    },
    scrollContent: {
        paddingTop: 300,
        paddingBottom: 0,
    },
    body: {
        flex: 1,
        backgroundColor: theme.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        gap: 16,
    },
    menuGroup: {
        borderRadius: 16,
        marginBottom: 15,     // <-- Extraído
        overflow: 'hidden',
        // Sombras extraídas
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
        backgroundColor: theme.iconBg,
        iconColor: Colors.icon,
        alignItems: 'center',
        justifyContent: 'center',
    },
    signOutIconWrapper: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F13B2D',
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
