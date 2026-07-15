import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

export const buildBookGridStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
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

    // BookGridItem
    bookGridWrapper: {
        width: COLUMN_WIDTH,
    },
    bookCoverContainer: {
        width: '100%',
        aspectRatio: 0.75,
        backgroundColor: theme.backgroundElement,
        borderRadius: 16,
        padding: 8,
        marginBottom: 12,
        shadowColor: theme.shadowBase,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
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
        color: theme.textItemTitle,
        marginBottom: 4,
    },
    bookGridAuthor: {
        fontSize: 12,
        color: theme.textAuthor,
        fontWeight: '500',
    }
});
