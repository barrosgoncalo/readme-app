import React, { useMemo, useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    SectionList, 
    TouchableOpacity, 
    Image,
    useColorScheme,
    ActivityIndicator,
    Modal,
    TextInput,
    StyleSheet
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '@readme/shared/src/constants/theme';
import { Iconify } from 'react-native-iconify';
import { buildShelfStyles } from '../../styles/shelfStyles';
import { useScrollTabBarControl } from '../../hooks/use-scroll-tab-bar-control';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { myBooksService } from '@readme/shared/src/services/books'; 

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

    // Update Progress Popup State
    const [isUpdatePopupVisible, setUpdatePopupVisible] = useState(false);
    const [selectedBookForUpdate, setSelectedBookForUpdate] = useState(null);
    const [newPageInput, setNewPageInput] = useState('');

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

    const submitProgressUpdate = () => {
        if (!selectedBookForUpdate) return;

        const parsedPage = parseInt(newPageInput, 10);
        if (isNaN(parsedPage)) {
            setUpdatePopupVisible(false);
            return; 
        }

        const totalPages = selectedBookForUpdate.bookDetails?.pageCount || 1;
        handlePageUpdate(selectedBookForUpdate.bookId, parsedPage, totalPages);

        // Reset and close modal
        setUpdatePopupVisible(false);
        setSelectedBookForUpdate(null);
        setNewPageInput('');
    };

    const openUpdatePopup = (book) => {
        setSelectedBookForUpdate(book);
        setNewPageInput(String(book.currentPage || 0));
        setUpdatePopupVisible(true);
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
            
            // 1. Internal unique key (Ensures January 2025 and January 2026 stay separated)
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

        // 2. Sort the sections from newest to oldest
        const sortedSections = Object.values(sectionsMap).sort((a, b) => b.sortTimestamp - a.sortTimestamp);

        // 3. UX Magic: Only append the year if it changes!
        let currentYearTracker = new Date().getFullYear();

        return sortedSections.map(section => {
            let displayTitle = section.month;

            // If the year of this section is different from our tracker, stamp the year and update the tracker!
            if (section.year !== currentYearTracker) {
                displayTitle = `${section.month} ${section.year}`;
                currentYearTracker = section.year;
            }

            return {
                title: displayTitle, // This gets passed directly to renderSectionHeader
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
                    <Iconify icon="fluent:add-circle-12-filled" size={24} color={theme.textMuted} />
                </View>
                <Text style={styles.addButtonText}>Add new Book</Text>
            </TouchableOpacity>

            {currentlyReadingBooks.length > 0 && (
                <View style={styles.currentlyReadingSection}>
                    <Text style={styles.sectionHeaderTitle}>Currently Reading</Text>

                    {currentlyReadingBooks.map((book) => (
                        <View key={book.bookId} style={[styles.currentReadingCard, { marginBottom: 16 }]}>
                            {book.bookDetails?.coverUrl ? (
                                <Image source={{ uri: book.bookDetails.coverUrl }} style={styles.bookCover} />
                            ) : (
                                    <View style={[styles.bookCover, { justifyContent: 'center', alignItems: 'center' }]}>
                                        <Iconify icon="lucide:book" size={24} color={theme.textMuted} />
                                    </View>
                                )}

                            <View style={styles.currentReadingInfo}>
                                <View>
                                    <Text style={styles.currentBookTitle} numberOfLines={1}>
                                        {book.bookDetails?.title || 'Unknown Title'}
                                    </Text>
                                    <Text style={styles.currentBookAuthor} numberOfLines={1}>
                                        {book.bookDetails?.authors?.join(', ') || 'Unknown Author'}
                                    </Text>
                                </View>

                                {/* Trigger the Popup! */}
                                <TouchableOpacity 
                                    style={styles.updateProgressButton} 
                                    activeOpacity={0.8}
                                    onPress={() => openUpdatePopup(book)}
                                >
                                    <Text style={styles.updateProgressText}>Update Progress</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.progressContainer}>
                                <Text style={styles.progressText}>{book.progressPercentage || 0}%</Text>
                                <Iconify icon="fluent:caret-right-24-filled" size={16} color={theme.textMuted} />
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    ), [currentlyReadingBooks, styles, theme]);

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
                        <TouchableOpacity style={styles.historyCard} activeOpacity={0.9}>
                            <View style={[styles.categoryDot, { backgroundColor: item.color || theme.primary }]} />
                            <Text style={styles.historyBookTitle}>
                                {item.bookDetails?.title || 'Unknown Title'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            />

            <AddBookPopup 
                isVisible={isAddPopupVisible} 
                onClose={() => setAddPopupVisible(false)} 
            />

            {/* ── UPDATE PROGRESS POPUP ── */}
            <Modal
                visible={isUpdatePopupVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setUpdatePopupVisible(false)}
            >
                <View style={localStyles.modalOverlay}>
                    <View style={[localStyles.modalContent, { backgroundColor: theme.backgroundElement || '#FFF' }]}>
                        <Text style={[localStyles.modalTitle, { color: theme.text }]}>Update Progress</Text>

                        <Text style={[localStyles.modalSubtitle, { color: theme.textMuted }]}>
                            What page are you currently on?
                        </Text>

                        <TextInput
                            style={[localStyles.input, { borderColor: theme.border, color: theme.text }]}
                            keyboardType="number-pad"
                            value={newPageInput}
                            onChangeText={setNewPageInput}
                            placeholder="e.g. 142"
                            placeholderTextColor={theme.textMuted}
                            autoFocus={true}
                        />

                        <View style={localStyles.buttonRow}>
                            <TouchableOpacity 
                                style={[localStyles.actionButton, localStyles.cancelButton]} 
                                onPress={() => setUpdatePopupVisible(false)}
                            >
                                <Text style={[localStyles.buttonText, { color: theme.text }]}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[localStyles.actionButton, localStyles.saveButton, { backgroundColor: theme.primary || '#E58F24' }]} 
                                onPress={submitProgressUpdate}
                            >
                                <Text style={[localStyles.buttonText, { color: '#FFF' }]}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ─── LOCAL STYLES FOR MODAL ─────────────────────────────────────────────────
const localStyles = StyleSheet.create({
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
    modalTitle: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 8
    },
    modalSubtitle: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginBottom: 20
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
    buttonText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold'
    }
});
