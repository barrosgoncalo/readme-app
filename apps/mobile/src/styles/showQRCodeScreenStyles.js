import { StyleSheet } from 'react-native';

export const buildShowQrCodeStyles = (theme) => StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: theme.background 
    },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        height: 56 
    },
    backButton: { 
        padding: 4 
    },
    headerTitle: { 
        fontSize: 16, 
        fontWeight: '700', 
        color: theme.textItemTitle 
    },
    headerSpacer: { 
        width: 32 
    },
    content: { 
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingHorizontal: 24, 
        paddingBottom: 56 
    },
    title: { 
        fontSize: 20, 
        fontWeight: '700', 
        marginBottom: 8, 
        textAlign: 'center', 
        color: theme.textItemTitle 
    },
    subtitle: { 
        fontSize: 14, 
        textAlign: 'center', 
        marginBottom: 32, 
        lineHeight: 20, 
        color: theme.subtext 
    },
    qrContainer: { 
        padding: 20, 
        borderRadius: 24, 
        borderWidth: 1, 
        backgroundColor: '#FFFFFF', 
        borderColor: theme.borderLight, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 8, 
        elevation: 2 
    },
    qrPlaceholder: { 
        width: 200, 
        height: 200, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    qrRawText: { 
        fontSize: 13, 
        fontWeight: '600', 
        marginTop: 12, 
        color: '#4A4A4A', 
        letterSpacing: 1 
    }
});
