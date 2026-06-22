import React, { useMemo, useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    SectionList, 
    TouchableOpacity, 
    useColorScheme,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { CurrentReadingCard } from '../../components/ui/CurrentReadingCard.js'
import { useFocusEffect } from '@react-navigation/native';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { Colors } from '@readme/shared/src/constants/theme';
import { Iconify } from 'react-native-iconify';

import { buildShelfStyles } from '../../styles/shelfStyles';
import { useScrollTabBarControl } from '../../hooks/use-scroll-tab-bar-control';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { myBooksService } from '@readme/shared/src/services/books'; 

import AddBookPopup from './AddBookPopup';



// ─── MAIN SCREEN COMPONENT ───────────────────────────────────────────────
export default function ReadingListScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildShelfStyles(theme);

    const { currentUser } = useAuth();

    // ─── STATE ───────────────────────────────────────────────────────────────
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddPopupVisible, setAddPopupVisible] = useState(false);

    // Delete Popup State
    const [isDeletePopupVisible, setDeletePopupVisible] = useState(false);
    const [selectedBookForDelete, setSelectedBookForDelete] = useState(null);

    // ─── HANDLERS ────────────────────────────────────────────────────────────
    const handlePageUpdate = async (bookId, newPage, totalPages) => {
        if (!currentUser?.uid) return;

        const safeTotal = totalPages > 0 ? totalPages : 1;
        const boundedPage = Math.min(Math.max(newPage, 0), safeTotal); 
        const newPercentage = Math.round((boundedPage / safeTotal) * 100);

        try {
            await myBooksService.updateBook(currentUser.uid, bookId, {
                currentPage: boundedPage,
                progressPercentage: newPercentage,
                ...(boundedPage === safeTotal && { 
                    status: 'finished', 
                    finishedAt: new Date().toISOString() 
                })
            });

            setBooks(prevBooks => 
                prevBooks.map(book => {
                    if (book.bookId === bookId) {
                        return { 
                            ...book, 
                            currentPage: boundedPage, 
                            progressPercentage: newPercentage,
                            status: boundedPage === safeTotal ? 'finished' : book.status
                        };
                    }
                    return book;
                })
            );
        } catch (error) {
            console.error("Failed to update page progress:", error);
        }
    };

    // ─── DELETE HANDLERS ─────────────────────────────────────────────────────
    const openDeletePopup = (book) => {
        setSelectedBookForDelete(book);
        setDeletePopupVisible(true);
    };

    const handleDeleteBook = async () => {
        if (!currentUser?.uid || !selectedBookForDelete) return;

        const targetId = selectedBookForDelete.bookId || selectedBookForDelete.id;

        if (!targetId) {
            console.error("Could not find a valid ID for this book!");
            return;
        }

        try {
            await myBooksService.deleteBook(currentUser.uid, targetId);
            setBooks(prevBooks => prevBooks.filter(book => (book.bookId || book.id) !== targetId));
        } catch (error) {
            console.error("Failed to delete book:", error);
        } finally {
            setDeletePopupVisible(false);
            setSelectedBookForDelete(null);
        }
    };

    // ─── DATA FETCHING ───────────────────────────────────────────────────────
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
    const currentlyReadingBooks = useMemo(() => 
        books.filter(book => book.status === 'reading')
    , [books]);

    const sectionsData = useMemo(() => {
        const finishedBooks = books.filter(book => book.status === 'finished');
        const sectionsMap = {};

        finishedBooks.forEach(book => {
            const date = new Date(book.finishedAt || book.addedAt); 
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            const monthName = monthNames[date.getMonth()];
            const year = date.getFullYear();

            const sectionKey = `${monthName}-${year}`;
            const dayLabel = String(date.getDate()).padStart(2, '0');

            if (!sectionsMap[sectionKey]) {
                sectionsMap[sectionKey] = {
                    month: monthName,
                    year: year,
                    sortTimestamp: new Date(year, date.getMonth(), 1).getTime(),
                    data: []
                };
            }

            sectionsMap[sectionKey].data.push({ ...book, day: dayLabel, rawDate: date.getTime() });
        });

        const sortedSections = Object.values(sectionsMap).sort((a, b) => b.sortTimestamp - a.sortTimestamp);

        let currentYearTracker = new Date().getFullYear();

        return sortedSections.map(section => {
            let displayTitle = section.month;

            if (section.year !== currentYearTracker) {
                displayTitle = `${section.month} ${section.year}`;
                currentYearTracker = section.year;
            }

            return {
                title: displayTitle, 
                data: section.data.sort((a, b) => b.rawDate - a.rawDate)
            };
        });
    }, [books]);

    const handleScroll = useScrollTabBarControl();

    // ─── RENDER HEADER ───────────────────────────────────────────────────────
    const headerElement = useMemo(() => (
        <View>
            <View style={styles.headerRow}>
                <Text style={styles.mainTitle}>Your Reading{"\n"}List</Text>
            </View>

            <TouchableOpacity 
                style={styles.addButton} 
                activeOpacity={0.7}
                onPress={() => setAddPopupVisible(true)} 
            >
                <View style={styles.iconWrapper}>
                    <Iconify icon="fluent:add-circle-12-filled" size={24} color={theme.darkerSecondary} />
                </View>
                <Text style={styles.addButtonText}>Add new Book</Text>
            </TouchableOpacity>

            {currentlyReadingBooks.length > 0 && (
                <View style={styles.currentlyReadingSection}>
                    <Text style={styles.sectionHeaderTitle}>Currently Reading</Text>

                    {currentlyReadingBooks.map((book) => (
                        <CurrentReadingCard 
                            key={book.bookId || book.id} 
                            book={book} 
                            theme={theme} 
                            styles={styles} 
                            navigation={navigation}
                            detailsRoute={ROUTES.BOOK_DETAILS}
                            onLongPress={openDeletePopup}
                            onSaveProgress={handlePageUpdate}
                        />
                    ))}
                </View>
            )}
        </View>
    ), [currentlyReadingBooks, styles, theme, navigation]);

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
                keyExtractor={(item) => item.bookId || item.id} 
                ListHeaderComponent={headerElement} 
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}

                renderSectionHeader={({ section: { title } }) => (
                    <Text style={styles.timelineMonthHeader}>{title}</Text>
                )}

                ListEmptyComponent={
                    (currentlyReadingBooks.length === 0 && sectionsData.length === 0) ? (
                        <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 120, paddingHorizontal: 30 }}>
                            <Iconify icon="lucide:library" size={56} color={theme.textMuted || '#999'} />
                            <Text style={{ fontSize: 18, fontFamily: 'Inter-SemiBold', color: theme.text, marginTop: 16, marginBottom: 8 }}>
                                Your shelf is empty
                            </Text>
                            <Text style={{ fontSize: 15, fontFamily: 'Inter-Regular', color: theme.textMuted, textAlign: 'center', lineHeight: 22 }}>
                                Tap the "Add new Book" button above to scan a barcode or search for your first book.
                            </Text>
                        </View>
                    ) : null
                }

                renderItem={({ item }) => (
                    <View style={styles.historyRow}>
                        <Text style={styles.historyDayText}>{item.day}</Text>
                        
                        <TouchableOpacity 
                            style={styles.historyCard} 
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate(ROUTES.BOOK_DETAILS, { book: item })}
                            onLongPress={() => openDeletePopup(item)} 
                        >
                            <View style={[styles.categoryDot, { backgroundColor: item.color || theme.primary }]} />

                            <View style={{ flex: 1 }}>
                                <Text style={styles.historyBookTitle} numberOfLines={1} ellipsizeMode="tail">
                                    {item.bookDetails?.title?.replace(/[\r\n]+/g, ' ').trim() || 'Unknown Title'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
            />

            <AddBookPopup 
                isVisible={isAddPopupVisible} 
                onClose={() => setAddPopupVisible(false)} 
            />

            {/* ── DELETE BOOK CONFIRMATION POPUP ── */}
            <Modal
                visible={isDeletePopupVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDeletePopupVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.backgroundElement || '#FFF' }]}>
                        
                        <View style={styles.warningIconContainer}>
                            <Iconify icon="lucide:trash-2" size={32} color="#EF4444" />
                        </View>
                        
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Delete Book?</Text>

                        <Text style={[styles.modalSubtitle, { color: theme.textMuted, textAlign: 'center' }]}>
                            Are you sure you want to remove "{selectedBookForDelete?.bookDetails?.title?.trim() || 'this book'}" from your list? This action cannot be undone.
                        </Text>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity 
                                style={[styles.actionButton, styles.cancelButton]} 
                                onPress={() => setDeletePopupVisible(false)}
                            >
                                <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.actionButton, styles.deleteButton]} 
                                onPress={handleDeleteBook}
                            >
                                <Text style={[styles.buttonText, { color: '#FFF' }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
