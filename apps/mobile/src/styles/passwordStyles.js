import { StyleSheet } from 'react-native';

export const buildStyles = (theme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        marginTop: 10,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
    },
    textContainer: {
        marginTop: 24,
        marginBottom: 20,
    },
    mainHeading: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.text,
    },
    subHeading: {
        fontSize: 16,
        color: theme.subtext,
        lineHeight: 20,
    },
    imageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
    illustration: {
        width: 200,
        height: 200,
    },
    formContainer: {
        marginTop: 10,
        gap: 15,
    },
    inputGroup: {
        flexDirection: 'column',
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: theme.backgroundElement,
        borderWidth: 1,
        borderColor: theme.backgroundSelected,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: theme.text,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.backgroundElement,
        borderWidth: 1,
        borderColor: theme.backgroundSelected,
        borderRadius: 8,
        paddingHorizontal: 16,
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: theme.text,
    },
    eyeButton: {
        padding: 4,
        marginLeft: 8,
    },
});
