import { StyleSheet } from 'react-native';

export const buildShelfStyles = (theme) => StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: theme.background
    },
    scrollContainer: { 
        paddingHorizontal: 28, 
        paddingTop: 80, 
    },
    headerRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 20
    },
    mainTitle: {
        fontFamily: 'Inter-Light', 
        fontWeight: '300',         
        fontSize: 34,
        color: theme.textDisplay,
        lineHeight: 45,
        letterSpacing: -0.5,
    },
    addButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 30
    },
    iconWrapper: { 
        marginRight: 8, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    addButtonText: {
        fontFamily: 'Inter-Light', 
        fontStyle: 'italic', 
        fontWeight: '300', 
        fontSize: 16, 
        color: theme.textBlack,
    },
    currentlyReadingSection: { 
        marginBottom: 20 
    },
    sectionHeaderTitle: {
        fontFamily: 'Inter-Italic', 
        fontStyle: 'italic', 
        fontSize: 16, 
        color: theme.textMuted, 
        marginBottom: 15,
    },
    currentReadingCard: {
        backgroundColor: theme.backgroundElement,
        borderRadius: 12, 
        paddingVertical: 16, 
        paddingHorizontal: 16,
        flexDirection: 'row', 
        alignItems: 'center',
        shadowColor: theme.shadowBase,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 5,
        shadowOpacity: 0.15,
        elevation: 10,
    },
    bookCover: { 
        width: 70, 
        height: 105, 
        borderRadius: 6, 
        marginRight: 16, 
        backgroundColor: theme.coverPlaceholder 
    },
    currentReadingInfo: { 
        flex: 1, 
        justifyContent: 'space-between', 
        height: 105, 
        paddingVertical: 4 
    },
    currentBookTitle: { 
        fontFamily: 'Inter-Regular', 
        fontSize: 20, 
        color: theme.textItemTitle, 
        marginBottom: 4 
    },
    currentBookAuthor: { 
        fontFamily: 'Inter-Regular', 
        fontSize: 14, 
        color: theme.textAuthor 
    },
    updateProgressButton: { 
        backgroundColor: theme.primary, 
        borderRadius: 6, 
        paddingVertical: 8, 
        paddingHorizontal: 16, 
        alignSelf: 'flex-start' 
    },
    updateProgressText: { 
        fontFamily: 'Inter-Regular', 
        color: theme.primaryText, 
        fontSize: 12 
    },
    progressContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        alignSelf: 'center' 
    },
    progressText: { 
        fontFamily: 'Inter-Italic', 
        fontSize: 14, 
        color: theme.textProgress,
        marginRight: 4 
    },
    timelineMonthHeader: { 
        fontFamily: 'Inter-Italic', 
        fontStyle: 'italic', 
        fontSize: 17, 
        color: theme.textMuted, 
        marginTop: 10, 
        marginBottom: 15
    },
    historyRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 12 
    },
    historyDayText: { 
        fontFamily: 'Inter-Italic', 
        fontStyle: 'italic', 
        width: 35, 
        fontSize: 16, 
        color: theme.textMuted, 
        textAlign: 'left' 
    },
    historyCard: {
        flex: 1, 
        backgroundColor: theme.backgroundElement,
        borderRadius: 12, 
        paddingVertical: 18, 
        paddingHorizontal: 16,
        flexDirection: 'row', 
        alignItems: 'center',
        shadowColor: theme.shadowBase,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 5,
        shadowOpacity: 0.15, 
        elevation: 10,
    },
    categoryDot: { 
        width: 16, 
        height: 16, 
        borderRadius: 8, 
        marginRight: 16 
    },
    historyBookTitle: { 
        fontFamily: 'Inter-Regular', 
        fontSize: 16, 
        color: theme.textItemTitle 
    },
});
