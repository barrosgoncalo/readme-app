import { StyleSheet } from 'react-native';

export const buildStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 250,
        height: 250,
    },
    mottoContainer: {
        position: 'absolute',
        top: '65%',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    mottoText: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.text,
        letterSpacing: 0.5,
    },
});
