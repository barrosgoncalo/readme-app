import { StyleSheet } from 'react-native';

export const buildShelfStyles = (theme) => StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: theme.background
    },
    scrollContainer: { 
        paddingHorizontal: 28, 
        paddingTop: 80, 
        paddingBottom: 100
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
        fontFamily: 'Inter-Italic', 
        fontStyle: 'italic', 
        fontWeight: '500', 
        fontSize: 16, 
        color: theme.darkerSecondary,
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
    fallbackCover: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookTextWrapper: {
        flex: 1,
        paddingRight: 10,
    },
    updateInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        padding: 4,
    },
    pageTextInput: {
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        minWidth: 45,
        textAlign: 'center',
        fontFamily: 'Inter-Medium',
        fontSize: 13,
    },
    maxPage: {
        fontSize: 12,
        marginHorizontal: 6,
        fontFamily: 'Inter-Medium',
    },
    smallSaveButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    smallSaveButtonText: {
        color: '#FFF',
        fontSize: 11,
        fontFamily: 'Inter-Bold',
    },
    maxPage: {
        color: theme.textMuted,
        fontSize: 12,
        marginHorizontal: 6,
        fontFamily: 'Inter-Medium'
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: '100%',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center'
    },
    warningIconContainer: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 50,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 8
    },
    modalSubtitle: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginBottom: 20,
        lineHeight: 20
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        marginBottom: 24,
        textAlign: 'center'
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between'
    },
    actionButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center'
    },
    cancelButton: {
        backgroundColor: 'transparent',
        marginRight: 8
    },
    saveButton: {
        marginLeft: 8
    },
    deleteButton: {
        backgroundColor: '#EF4444',
        marginLeft: 8
    },
    buttonText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold'
    }
});
