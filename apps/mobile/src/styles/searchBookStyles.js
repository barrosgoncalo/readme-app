import { StyleSheet } from "react-native";
import { withOpacity } from "@readme/shared/src/utils/colorUtils";
import { Fonts } from "@readme/shared/src/constants/theme";

export const buildSearchBookStyles = () => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: withOpacity( '#000000', 0.05 ),
    },
    backBtn: {
        marginRight: 12,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: Fonts.inter_regular,
        height: '100%',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        fontFamily: Fonts.inter_medium,
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: Fonts.inter_semi,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 15,
        fontFamily: Fonts.inter_regular,
        textAlign: 'center',
        lineHeight: 22,
    },
    listContainer: {
        padding: 16,
    },
    bookCard: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 16,
        marginBottom: 16,
    },
    bookCover: {
        width: 65,
        height: 98,
        borderRadius: 6,
        backgroundColor: '#EAEAEA',
    },
    placeholderCover: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookDetails: {
        flex: 1,
        marginLeft: 14,
        justifyContent: 'space-between',
    },
    bookTitle: {
        fontSize: 16,
        fontFamily: Fonts.inter_semi,
        marginBottom: 4,
    },
    bookAuthor: {
        fontSize: 14,
        color: '#666',
        fontFamily: Fonts.inter_regular,
        marginBottom: 4,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 8,
    },
    bookPages: {
        fontSize: 12,
        color: '#999',
        fontFamily: Fonts.inter_medium,
    },
    addButton: {
        backgroundColor: '#F58B2E',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 64,
        alignItems: 'center',
    },
    addingButton: {
        backgroundColor: '#D37522',
    },
    addButtonText: {
        color: '#FFF',
        fontSize: 13,
        fontFamily: Fonts.inter_semi,
    }
});
