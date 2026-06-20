import React, { useMemo, useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    SectionList, 
    TouchableOpacity, 
    Image,
    useColorScheme,
    ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // Added to refresh data when returning from scanner
import { Colors } from '@readme/shared/src/constants/theme';
import { Iconify } from 'react-native-iconify';
import { buildShelfStyles } from '../../styles/shelfStyles';
import { useScrollTabBarControl } from '../../hooks/use-scroll-tab-bar-control';
import { useAuth } from '@readme/shared/src/contexts/AuthContext'; // Import Auth
import { myBooksService } from '@readme/shared/src/services/books'; // Import Service

import AddBookPopup from './AddBookPopup';

export default function ReadingListScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildShelfStyles(theme);
    
    const { currentUser } = useAuth();

    // ─── STATE ───────────────────────────────────────────────────────────────
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddPopupVisible, setAddPopupVisible] = useState(false);

    // ─── DATA FETCHING ───────────────────────────────────────────────────────
    // useFocusEffect runs every time the user navigates back to this screen
    useFocusEffect(
        useCallback(() => {
            const fetchBooks = async () => {
                if (!currentUser?.uid) return;
                
                try {
                    setIsLoading(true);
                    const userBooks = await myBooksService.getBooks(currentUser.uid);
                    setBooks(userBooks);
                } catch (error) {
                    console.error("Error fetching books:", error);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchBooks();
        }, [currentUser])
    );

    // ─── DATA PROCESSING ─────────────────────────────────────────────────────
    const currentlyReading = useMemo(() => 
        books.find(book => book.status === 'reading')
    , [books]);

    const sectionsData = useMemo(() => {
        const finishedBooks = books.filter(book => book.status === 'finished');
        const sectionsMap = {};
        
        finishedBooks.forEach(book => {
            // Using finishedAt from our new book model
            const date = new Date(book.finishedAt || book.addedAt); 
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const monthLabel = monthNames[date.getMonth()];
            const dayLabel = String(date.getDate()).padStart(2, '0');

            if (!sectionsMap[monthLabel]) sectionsMap[monthLabel] = [];
            sectionsMap[monthLabel].push({ ...book, day: dayLabel });
        });

        // Sort months or items here if needed later
        return Object.keys(sectionsMap).map(month => ({
            title: month,
            data: sectionsMap[month]
        }));
    }, [books]);

    const handleScroll = useScrollTabBarControl();

    // ─── RENDER HEADER ───────────────────────────────────────────────────────
    const headerElement = useMemo(() => (
        <View>
            {/* Main Title Row */}
            <View style={styles.headerRow}>
                <Text style={styles.mainTitle}>Your Reading{"\n"}List</Text>
            </View>

            {/* Add New Book Trigger */}
            <TouchableOpacity 
                style={styles.addButton} 
                activeOpacity={0.7}
                onPress={() => setAddPopupVisible(true)} 
            >
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
                        {currentlyReading.coverUrl ? (
                            <Image source={{ uri: currentlyReading.coverUrl }} style={styles.bookCover} />
                        ) : (
                            <View style={[styles.bookCover, { justifyContent: 'center', alignItems: 'center' }]}>
                                <Iconify icon="lucide:book" size={24} color={theme.textMuted} />
                            </View>
                        )}

                        <View style={styles.currentReadingInfo}>
                            <View>
                                <Text style={styles.currentBookTitle} numberOfLines={2}>
                                    {currentlyReading.title}
                                </Text>
                                {/* Adjusted to read from the array of authors */}
                                <Text style={styles.currentBookAuthor} numberOfLines={1}>
                                    {currentlyReading.authors?.join(', ') || 'Unknown Author'}
                                </Text>
                            </View>

                            <TouchableOpacity style={styles.updateProgressButton} activeOpacity={0.8}>
                                <Text style={styles.updateProgressText}>Update Progress</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.progressContainer}>
                            {/* Adjusted to read progressPercentage */}
                            <Text style={styles.progressText}>{currentlyReading.progressPercentage || 0}%</Text>
                            <Iconify icon="fluent:caret-right-24-filled" size={16} color={theme.textMuted} />
                        </View>
                    </View>
                </View>
            )}
        </View>
    ), [currentlyReading, styles, theme]); // Added theme to dependencies for Iconify colors

    // ─── MAIN RENDER ─────────────────────────────────────────────────────────
    if (isLoading && books.length === 0) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SectionList
                sections={sectionsData}
                keyExtractor={(item) => item.bookId || item.id} // Supports new model ID
                
                ListHeaderComponent={headerElement} 
                
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}

                renderSectionHeader={({ section: { title } }) => (
                    <Text style={styles.timelineMonthHeader}>{title}</Text>
                )}

                ListEmptyComponent={
                    (!currentlyReading && sectionsData.length === 0) ? (
                        <View style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 95,
                            paddingHorizontal: 30
                        }}>
                            <Iconify
                                icon="lucide:library"
                                size={56}
                                color={theme.textMuted || '#999'}
                            />
                            <Text style={{
                                fontSize: 18,
                                fontFamily: 'Inter-SemiBold',
                                color: theme.text,
                                marginTop: 16,
                                marginBottom: 8
                            }}>
                                Your shelf is empty
                            </Text>
                            <Text style={{
                                fontSize: 15,
                                fontFamily: 'Inter-Regular',
                                color: theme.textMuted,
                                textAlign: 'center', lineHeight: 22 }}>
                                Tap the "Add new Book" button above to scan a barcode or search for your first book.
                            </Text>
                        </View>
                    ) : null
                }

                renderItem={({ item }) => (
                    <View style={styles.historyRow}>
                        <Text style={styles.historyDayText}>{item.day}</Text>
                        <TouchableOpacity style={styles.historyCard} activeOpacity={0.9}>
                            <View style={[styles.categoryDot, { backgroundColor: item.color || theme.primary }]} />
                            <Text style={styles.historyBookTitle}>{item.title}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
            
            <AddBookPopup 
                isVisible={isAddPopupVisible} 
                onClose={() => setAddPopupVisible(false)} 
            />
        </View>
    );
}
