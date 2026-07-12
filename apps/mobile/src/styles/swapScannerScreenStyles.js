import { StyleSheet, Platform } from 'react-native';

export const buildSwapScannerStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    overlayContainer: {
        flex: 1,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 56,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    closeButton: {
        padding: 8,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    headerSpacer: {
        width: 40,
    },
    viewfinderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 40,
    },
    instructions: {
        color: '#FFFFFF',
        fontSize: 14,
        marginBottom: 24,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: {
            width: 0,
            height: 1,
        },
        textShadowRadius: 4,
    },
    viewfinderFrame: {
        width: 240,
        height: 240,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderColor: '#FFFFFF',
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 3,
        borderLeftWidth: 3,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 3,
        borderRightWidth: 3,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 3,
        borderLeftWidth: 3,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 3,
        borderRightWidth: 3,
    },
    bottomBar: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        alignItems: 'center',
    },
    backButton: {
        marginTop: 20,
    },
    backButtonText: {
        color: '#FFFFFF',
    },
});
