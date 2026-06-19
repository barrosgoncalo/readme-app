import React, { useRef, useMemo } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    SectionList, 
    TouchableOpacity, 
    Image,
} from 'react-native';
import { Iconify } from 'react-native-iconify';
import { useTabBarVisibility } from '../../components/ui/TabBarContext'; 

// 1. FLAT SOURCE DATA
// 1. FLAT SOURCE DATA (Expanded for scroll testing)
const SAMPLE_BOOKS_DATA = [
    { 
        id: '1', 
        title: 'The Art of War', 
        author: 'Sun Tzu', 
        status: 'reading', 
        progress: 35,
        coverUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Art_of_War_cover.jpg/300px-Art_of_War_cover.jpg' 
    },
    { id: '2', title: 'Dune', author: 'Frank Herbert', status: 'finished', dateFinished: '2026-05-22', color: '#3A9FBF' },
    { id: '3', title: '1984', author: 'George Orwell', status: 'finished', dateFinished: '2026-05-18', color: '#E58F24' },
    { id: '4', title: 'The Hobbit', author: 'J.R.R. Tolkien', status: 'finished', dateFinished: '2026-05-07', color: '#24CBE5' },
    { id: '5', title: 'Fahrenheit 451', author: 'Ray Bradbury', status: 'finished', dateFinished: '2026-04-30', color: '#666666' },
    { id: '6', title: 'Brave New World', author: 'Aldous Huxley', status: 'finished', dateFinished: '2026-04-24', color: '#B51A1A' },
    { id: '7', title: 'Project Hail Mary', author: 'Andy Weir', status: 'finished', dateFinished: '2026-03-15', color: '#3A9FBF' },
    { id: '8', title: 'Atomic Habits', author: 'James Clear', status: 'finished', dateFinished: '2026-03-02', color: '#E58F24' },
    { id: '9', title: 'Deep Work', author: 'Cal Newport', status: 'finished', dateFinished: '2026-02-28', color: '#24CBE5' },
    { id: '10', title: 'Sapiens', author: 'Yuval Noah Harari', status: 'finished', dateFinished: '2026-02-14', color: '#666666' },
    { id: '11', title: 'The Martian', author: 'Andy Weir', status: 'finished', dateFinished: '2026-01-30', color: '#B51A1A' },
    { id: '12', title: 'Foundation', author: 'Isaac Asimov', status: 'finished', dateFinished: '2026-01-12', color: '#3A9FBF' },
    { id: '13', title: 'Neuromancer', author: 'William Gibson', status: 'finished', dateFinished: '2025-12-20', color: '#E58F24' },
    { id: '14', title: 'Snow Crash', author: 'Neal Stephenson', status: 'finished', dateFinished: '2025-12-05', color: '#24CBE5' },
];

export default function ReadingListScreen() {

    // 2. DATA PROCESSING (Memoized so it doesn't recalculate on scroll!)
    const currentlyReading = useMemo(() => 
        SAMPLE_BOOKS_DATA.find(book => book.status === 'reading')
    , []);

    const sectionsData = useMemo(() => {
        const finishedBooks = SAMPLE_BOOKS_DATA.filter(book => book.status === 'finished');
        const sectionsMap = {};
        
        finishedBooks.forEach(book => {
            const date = new Date(book.dateFinished);
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const monthLabel = monthNames[date.getMonth()];
            const dayLabel = String(date.getDate()).padStart(2, '0');

            if (!sectionsMap[monthLabel]) sectionsMap[monthLabel] = [];
            sectionsMap[monthLabel].push({ ...book, day: dayLabel });
        });

        return Object.keys(sectionsMap).map(month => ({
            title: month,
            data: sectionsMap[month]
        }));
    }, []);

    // --- Tab Bar Visibility Logic ---

    const { showTabBar, hideTabBar } = useTabBarVisibility();
    const lastOffsetY = useRef(0);

    const handleScroll = (event) => {
        const currentOffset = event.nativeEvent.contentOffset.y;
        
        // Calculate exactly how many pixels the user scrolled since the last frame
        const diff = currentOffset - lastOffsetY.current;

        // SENSITIVITY CONTROL: 
        // How many pixels must the user scroll before the tab bar reacts?
        // Lower numbers (like 3-5) = hyper-sensitive, disappears instantly.
        // Higher numbers (like 15+) = requires a more deliberate, longer swipe.
        const sensitivityThreshold = 4; 

        if (diff > sensitivityThreshold && currentOffset > 10) {
            // User is explicitly scrolling down the page -> hide it instantly
            hideTabBar();
        } else if (diff < -sensitivityThreshold) {
            // User is explicitly scrolling up the page -> show it instantly
            showTabBar();
        }

        // Safety check: always force it open at the absolute top of the screen
        if (currentOffset <= 0) {
            showTabBar();
        }

        lastOffsetY.current = currentOffset;
    };

    // --------------------------------

    // 3. RENDER HEADER (Memoized element variable, NOT a component function)
    const headerElement = useMemo(() => (
        <View>
            {/* Main Title Row */}
            <View style={styles.headerRow}>
                <Text style={styles.mainTitle}>Your Reading{"\n"}List</Text>
                <View style={styles.avatarContainer}>
                    <Text style={{ fontSize: 24 }}>🐛</Text>
                </View>
            </View>

            {/* Add New Book Trigger */}
            <TouchableOpacity style={styles.addButton} activeOpacity={0.7}>
                <View style={styles.iconWrapper}>
                    <Iconify icon="fluent:add-circle-12-filled" size={24} color="#C4BDB8" />
                </View>
                <Text style={styles.addButtonText}>Add new Book</Text>
            </TouchableOpacity>

            {/* Currently Reading Section */}
            {currentlyReading && (
                <View style={styles.currentlyReadingSection}>
                    <Text style={styles.sectionHeaderTitle}>Currently Reading</Text>

                    <View style={styles.currentReadingCard}>
                        <Image source={{ uri: currentlyReading.coverUrl }} style={styles.bookCover} />

                        <View style={styles.currentReadingInfo}>
                            <View>
                                <Text style={styles.currentBookTitle}>{currentlyReading.title}</Text>
                                <Text style={styles.currentBookAuthor}>{currentlyReading.author}</Text>
                            </View>

                            <TouchableOpacity style={styles.updateProgressButton} activeOpacity={0.8}>
                                <Text style={styles.updateProgressText}>Update Progress</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.progressContainer}>
                            <Text style={styles.progressText}>{currentlyReading.progress}%</Text>
                            <Iconify icon="fluent:caret-right-24-filled" size={16} color="rgba(28, 14, 5, 0.2)" />
                        </View>
                    </View>
                </View>
            )}
        </View>
    ), [currentlyReading]); // Will only update if 'currentlyReading' data changes

    // 4. MAIN RENDER
    return (
        <View style={styles.container}>
            <SectionList
                sections={sectionsData}
                keyExtractor={(item) => item.id}
                
                // Passed the memoized variable here!
                ListHeaderComponent={headerElement} 
                
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}

                renderSectionHeader={({ section: { title } }) => (
                    <Text style={styles.timelineMonthHeader}>{title}</Text>
                )}

                renderItem={({ item }) => (
                    <View style={styles.historyRow}>
                        <Text style={styles.historyDayText}>{item.day}</Text>
                        <TouchableOpacity style={styles.historyCard} activeOpacity={0.9}>
                            <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                            <Text style={styles.historyBookTitle}>{item.title}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
}

// 5. STYLES
const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#F2F0EF' 
    },
    scrollContainer: { 
        paddingHorizontal: 28, 
        paddingTop: 70, 
        paddingBottom: 120
    },
    headerRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 25 
    },
    mainTitle: {
        fontFamily: 'Inter-Light', 
        fontWeight: '300',         
        fontSize: 34,
        color: '#363230',
        lineHeight: 40,
        letterSpacing: -0.5,
    },
    avatarContainer: {
        width: 50, 
        height: 50, 
        borderRadius: 30, 
        backgroundColor: '#F7D0A3',
        alignItems: 'center', 
        justifyContent: 'center', 
        borderWidth: 1, 
        borderColor: '#E4DFDC',
    },
    addButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 40 
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
        color: '#000000',
    },
    currentlyReadingSection: { 
        marginBottom: 25 
    },
    sectionHeaderTitle: {
        fontFamily: 'Inter-Italic', 
        fontStyle: 'italic', 
        fontSize: 16, 
        color: '#C4BDB8', 
        marginBottom: 18,
    },
    currentReadingCard: {
        backgroundColor: '#FFFFFF', 
        borderRadius: 12, 
        paddingVertical: 16, 
        paddingHorizontal: 16,
        flexDirection: 'row', 
        alignItems: 'center',
        shadowColor: '#00000025',
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
        backgroundColor: '#E8E5E3' 
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
        color: '#1C0E05', 
        marginBottom: 4 
    },
    currentBookAuthor: { 
        fontFamily: 'Inter-Regular', 
        fontSize: 14, 
        color: 'rgba(28, 14, 5, 0.4)' 
    },
    updateProgressButton: { 
        backgroundColor: '#5C3D2E', 
        borderRadius: 6, 
        paddingVertical: 8, 
        paddingHorizontal: 16, 
        alignSelf: 'flex-start' 
    },
    updateProgressText: { 
        fontFamily: 'Inter-Regular', 
        color: '#FFFFFF', 
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
        color: 'rgba(28, 14, 5, 0.2)',
        marginRight: 4 
    },
    timelineMonthHeader: { 
        fontFamily: 'Inter-Italic', 
        fontStyle: 'italic', 
        fontSize: 16, 
        color: '#C4BDB8', 
        marginTop: 15, 
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
        color: '#C4BDB8', 
        textAlign: 'left' 
    },
    historyCard: {
        flex: 1, 
        backgroundColor: '#FFFFFF', 
        borderRadius: 12, 
        paddingVertical: 18, 
        paddingHorizontal: 16,
        flexDirection: 'row', 
        alignItems: 'center',
        shadowColor: '#00000025',
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
        color: '#1C0E05' 
    },
});
