import { StyleSheet, Dimensions } from 'react-native';
import { Fonts } from '@readme/shared/src/constants/theme';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

export const buildExploreStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },

    // --- Header ---
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 24,
        paddingTop: 80,
        paddingBottom: 15,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        paddingBottom: 5,
        color: theme.textDisplay,
    },
    headerSubtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.secondary,
        marginTop: 2,
        fontFamily: Fonts.inter_bold
    },
    searchButton: {
        padding: 5,
    },
    
    swapSectionContainer: {
        backgroundColor: theme.headerBackground,
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
        backgroundColor: theme.tabBarBackground, // Adaptado
        borderRadius: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 8,
        paddingHorizontal: 12,
        width: '85%',
        height: 64,
        shadowColor: theme.shadowBase, // Adaptado
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1, // Opacidade agora é gerida pela própria cor (Hex + Alpha) no tema
        shadowRadius: 10,
        elevation: 8,
    },
    navTabActive: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.tabBarPillActive, // Adaptado
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        gap: 8,
    },
    navTextActive: {
        color: theme.tabBarTextActive, // Adaptado
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
        backgroundColor: theme.backgroundElement, // Adaptado
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
        borderColor: theme.backgroundElement, // Adaptado para criar um recorte visual ao redor da badge
    },
    
    // BookGridItem
    bookGridWrapper: {
        width: COLUMN_WIDTH,
    },
    bookCoverContainer: {
        width: '100%',
        aspectRatio: 0.75,
        backgroundColor: theme.backgroundElement, // Adaptado
        borderRadius: 16,
        padding: 8, 
        marginBottom: 12,
        shadowColor: theme.shadowBase, // Adaptado
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1, // Opacidade gerida no tema
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
        color: theme.textItemTitle, // Adaptado
        marginBottom: 4,
    },
    bookGridAuthor: {
        fontSize: 12,
        color: theme.textAuthor, // Adaptado
        fontWeight: '500',
    }
});
