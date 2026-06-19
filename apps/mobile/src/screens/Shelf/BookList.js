import React, { useMemo } from 'react';
import { 
    View, 
    Text, 
    SectionList, 
    TouchableOpacity, 
    Image,
    useColorScheme,
} from 'react-native';
import { Colors } from '@readme/shared/src/constants/theme';
import { Iconify } from 'react-native-iconify';
import { buildShelfStyles } from '../../styles/shelfStyles';
import { useScrollTabBarControl } from '../../hooks/use-scroll-tab-bar-control';


// 1. FLAT SOURCE DATA
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

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildShelfStyles(theme);

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


    const handleScroll = useScrollTabBarControl();


    // 3. RENDER HEADER (Memoized element variable, NOT a component function)
    const headerElement = useMemo(() => (
        <View>
            {/* Main Title Row */}
            <View style={styles.headerRow}>
                <Text style={styles.mainTitle}>Your Reading{"\n"}List</Text>
            </View>

            {/* Add New Book Trigger */}
            <TouchableOpacity style={styles.addButton} activeOpacity={0.7}>
                <View style={styles.iconWrapper}>
                    <Iconify icon="fluent:add-circle-12-filled" size={24} color={theme.textMuted} />
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
                            <Iconify icon="fluent:caret-right-24-filled" size={16} color={theme.caret} />
                        </View>
                    </View>
                </View>
            )}
        </View>
    ), [currentlyReading, styles]);

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

