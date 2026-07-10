import { StyleSheet } from 'react-native';

export const buildOfferFlowStyles = (theme) => StyleSheet.create({
    // --- Shared ---
    container: { 
        flex: 1, 
        backgroundColor: theme.background 
    },
    loadingContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    loadingText: { 
        marginTop: 12, 
        fontSize: 14, 
        fontWeight: '600', 
        color: theme.subtext 
    },

    // --- Step One ---
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        paddingBottom: 16, 
        paddingTop: 12 
    },
    backButton: { padding: 4 },
    headerTitle: { 
        fontSize: 18, 
        fontWeight: '700', 
        color: theme.textItemTitle 
    },
    centerContent: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 24 
    },
    emptyText: { 
        fontSize: 16, 
        textAlign: 'center', 
        lineHeight: 24, 
        color: theme.subtext 
    },
    listContainer: { padding: 16, paddingBottom: 120 },
    row: { justifyContent: 'space-between', marginBottom: 16 },
    bottomBar: { 
        position: 'absolute', 
        bottom: 0, 
        width: '100%', 
        paddingHorizontal: 20, 
        paddingTop: 16, 
        paddingBottom: 16, 
        borderTopWidth: 1, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: -4 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 12, 
        elevation: 10,
        backgroundColor: theme.backgroundElement,
        borderTopColor: theme.borderLight
    },
    nextButtonBase: { 
        width: '100%', 
        borderRadius: 16, 
        paddingVertical: 16, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 12,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    nextButtonActive: {
        backgroundColor: theme.primary || '#E58A1F',
        shadowColor: theme.primary || '#E58A1F',
        elevation: 8,
    },
    nextButtonDisabled: {
        backgroundColor: theme.borderLight,
        shadowColor: '#000',
        elevation: 0,
    },
    nextButtonText: { 
        fontSize: 16, 
        fontWeight: '700', 
        letterSpacing: 0.5 
    },

    // --- Step Two ---
    mapContainer: { flex: 1, position: 'relative' },
    map: { width: '100%', height: '100%' },
});
