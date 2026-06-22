import { StyleSheet, Dimensions } from 'react-native';
import { Fonts } from '@readme/shared/src/constants/theme';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

export const buildExploreStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5', // Fundo cinzento claro da imagem
    },
    // --- Header ---
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#111111',
    },
    headerSubtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.secondary,
        marginTop: 4,
        fontFamily: Fonts.inter_bold
    },
    searchButton: {
        padding: 8,
    },
    
    swapSectionContainer: {
        backgroundColor: '#26150F',
        borderRadius: 20,
        paddingVertical: 10,
        marginBottom: 24,
        overflow: 'hidden',
    },
    swapList: {
        gap: 16,
        paddingHorizontal: 28,
        paddingTop: 12,
        paddingBottom: 12,
    },
    
    // --- Grid de Livros ---
    gridContainer: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    
    // --- Floating Nav Bar ---
    navBarContainer: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        backgroundColor: '#000000',
        borderRadius: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 8,
        paddingHorizontal: 12,
        width: '85%',
        height: 64,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    navTabActive: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2A2A2A',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        gap: 8,
    },
    navTextActive: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    navTabInactive: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },

    // --- Estilos dos Componentes Extraídos ---
    // SwapCard
    swapCardWrapper: {
        width: 76,
        height: 102,
        marginRight: 12,
        borderRadius: 8,
        backgroundColor: '#FFF',
    },
    swapCardImage: {
        width: '100%',
        height: '100%',
        borderRadius: 6,
        resizeMode: 'cover',
    },
    statusBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#00000',
    },
    
    // BookGridItem
    bookGridWrapper: {
        width: COLUMN_WIDTH,
    },
    bookCoverContainer: {
        width: '100%',
        aspectRatio: 0.75,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 8, // Borda branca em volta da imagem
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    bookGridImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        resizeMode: 'cover',
    },
    bookGridTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#222',
        marginBottom: 4,
    },
    bookGridAuthor: {
        fontSize: 12,
        color: '#888',
        fontWeight: '500',
    }
});
