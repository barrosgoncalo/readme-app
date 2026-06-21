import { StyleSheet } from "react-native";

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
        borderBottomColor: 'rgba(0,0,0,0.05)',
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
        fontFamily: 'Inter-Regular',
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
        fontFamily: 'Inter-Medium',
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 15,
        fontFamily: 'Inter-Regular',
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
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    bookAuthor: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'Inter-Regular',
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
        fontFamily: 'Inter-Medium',
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
        fontFamily: 'Inter-SemiBold',
    }
});
