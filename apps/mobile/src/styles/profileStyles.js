import { StyleSheet } from 'react-native';
import { Spacing, Fonts, Colors } from '@readme/shared/src/constants/theme';

export const buildStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 24,
    },
    avatarContainer: {
        width: 104,
        height: 104,
        borderRadius: 52,
        borderWidth: 4,
        borderColor: '#F58B2E',
        padding: 4,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 46,
        backgroundColor: '#F58B2E',
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
        fontSize: 18,
        fontWeight: '600',
    },
    userEmail: {
        fontSize: 14,
        color: '#D6D3D1',
    },
    body: {
        flex: 1,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 40,
        gap: 16,
    },
    menuGroup: {
        backgroundColor: Colors.cardBackground,
        borderRadius: 16,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconWrapper: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#D1CCC9',
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
