import { StyleSheet } from 'react-native';

export const buildSelectSwapBookStyles = (theme) => StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: theme.background 
    },
    safeAreaTop: { 
        backgroundColor: theme.background 
    },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        paddingVertical: 16, 
        zIndex: 10 
    },
    headerTitle: { 
        fontSize: 20, 
        fontWeight: '700', 
        color: theme.textItemTitle 
    },
    backButton: { 
        padding: 4 
    },
    headerSpacer: { 
        width: 32 
    },
    guidanceContainer: { 
        paddingHorizontal: 20, 
        paddingBottom: 20, 
        borderBottomWidth: 1, 
        borderBottomColor: theme.borderLight 
    },
    guidanceText: { 
        fontSize: 15, 
        lineHeight: 22, 
        color: theme.subtext 
    },
    centerContent: { 
        padding: 40, 
        alignItems: 'center' 
    },
    emptyText: { 
        color: theme.subtext 
    },
    bookListContainer: { 
        padding: 20, 
        paddingBottom: 120 
    },
    bookCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16, 
        borderRadius: 16, 
        borderWidth: 2, 
        marginBottom: 16,
        backgroundColor: theme.backgroundElement, 
        borderColor: theme.borderLight 
    },
    bookCardSelected: { 
        borderColor: theme.primary 
    },
    bookImage: { 
        width: 80, 
        height: 120, 
        borderRadius: 8, 
        backgroundColor: '#EAEAEA' 
    },
    bookInfo: { 
        flex: 1, 
        marginLeft: 20, 
        justifyContent: 'center' 
    },
    bookTitle: { 
        fontSize: 18, 
        fontWeight: '700', 
        marginBottom: 4, 
        color: theme.textItemTitle 
    },
    detailsButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginTop: 6, 
        gap: 6 
    },
    detailsButtonText: { 
        fontSize: 14, 
        fontWeight: '600', 
        textDecorationLine: 'underline', 
        color: theme.subtext 
    },
    checkBadge: { 
        position: 'absolute', 
        top: 16, 
        right: 16 
    },
    bottomBar: { 
        position: 'absolute', 
        bottom: 0, 
        width: '100%', 
        paddingHorizontal: 20, 
        paddingTop: 16, 
        paddingBottom: 16, 
        borderTopWidth: 1,
        backgroundColor: theme.backgroundElement,
        borderTopColor: theme.borderLight,
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: -4 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 12, 
        elevation: 10 
    },
    nextButton: { 
        width: '100%', 
        borderRadius: 16, 
        paddingVertical: 16, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 12,
        backgroundColor: theme.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.3, 
        shadowRadius: 8,
        elevation: 0
    },
    nextButtonActive: {
        backgroundColor: theme.primary || '#E58A1F',
        shadowColor: theme.primary || '#E58A1F',
        elevation: 8,
    },
    nextButtonText: { 
        fontSize: 16, 
        fontWeight: '700', 
        letterSpacing: 0.5,
        color: theme.subtext 
    },
    nextButtonTextActive: {
        color: '#FFFFFF'
    }
});
