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
import { ROUTES } from '@readme/shared/src/constants/routes';
import { Colors } from '@readme/shared/src/constants/theme';
import { Iconify } from 'react-native-iconify';
import { buildShelfStyles } from '../../styles/shelfStyles';
import { useScrollTabBarControl } from '../../hooks/use-scroll-tab-bar-control';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { myBooksService } from '@readme/shared/src/services/books'; 

import AddBookPopup from './AddBookPopup';

export default function ReadingListScreen({ navigation }) {
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

    const submitProgressUpdate = () => {
        if (!selectedBookForUpdate) return;

        const parsedPage = parseInt(newPageInput, 10);
        if (isNaN(parsedPage)) {
            setUpdatePopupVisible(false);
            return; 
        }

        const totalPages = selectedBookForUpdate.bookDetails?.pageCount || 1;
        handlePageUpdate(selectedBookForUpdate.bookId, parsedPage, totalPages);

        setUpdatePopupVisible(false);
        setSelectedBookForUpdate(null);
        setNewPageInput('');
    };

    const openUpdatePopup = (book) => {
        setSelectedBookForUpdate(book);
        setNewPageInput(String(book.currentPage || 0));
        setUpdatePopupVisible(true);
    };

    // ─── DELETE HANDLERS ─────────────────────────────────────────────────────

    const openDeletePopup = (book) => {
        setSelectedBookForDelete(book);
        setDeletePopupVisible(true);
    };

    const handleDeleteBook = async () => {
        if (!currentUser?.uid || !selectedBookForDelete) return;

        // Safely grab whichever ID your database uses
        const targetId = selectedBookForDelete.bookId || selectedBookForDelete.id;

        if (!targetId) {
            console.error("Could not find a valid ID for this book!");
            return;
        }

        try {
            // Delete from backend DB
            await myBooksService.deleteBook(currentUser.uid, targetId);

            // Instantly remove it from the local UI state using the safe ID
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
                    <Iconify icon="fluent:add-circle-12-filled" size={24} color={theme.textMuted} />
                </View>
                <Text style={styles.addButtonText}>Add new Book</Text>
            </TouchableOpacity>

            {currentlyReadingBooks.length > 0 && (
                <View style={styles.currentlyReadingSection}>
                    <Text style={styles.sectionHeaderTitle}>Currently Reading</Text>

                    {currentlyReadingBooks.map((book) => (
                        <TouchableOpacity 
                            key={book.bookId} 
                            style={[styles.currentReadingCard, { marginBottom: 16 }]}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate(ROUTES.BOOK_DETAILS, { book: book })}
                            onLongPress={() => openDeletePopup(book)} // <-- ADDED LONG PRESS HERE
                        >
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
                                        {book.bookDetails?.title?.replace(/[\r\n]+/g, ' ').trim() || 'Unknown Title'}
                                    </Text>
                                    <Text style={styles.currentBookAuthor} numberOfLines={1}>
                                        {book.bookDetails?.authors?.join(', ') || 'Unknown Author'}
                                    </Text>
                                </View>

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
                        </TouchableOpacity>
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
                            onLongPress={() => openDeletePopup(item)} // <-- ADDED LONG PRESS HERE
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

            {/* ── DELETE BOOK CONFIRMATION POPUP ── */}
            <Modal
                visible={isDeletePopupVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDeletePopupVisible(false)}
            >
                <View style={localStyles.modalOverlay}>
                    <View style={[localStyles.modalContent, { backgroundColor: theme.backgroundElement || '#FFF' }]}>
                        
                        <View style={localStyles.warningIconContainer}>
                            <Iconify icon="lucide:trash-2" size={32} color="#EF4444" />
                        </View>
                        
                        <Text style={[localStyles.modalTitle, { color: theme.text }]}>Delete Book?</Text>

                        <Text style={[localStyles.modalSubtitle, { color: theme.textMuted, textAlign: 'center' }]}>
                            Are you sure you want to remove "{selectedBookForDelete?.bookDetails?.title?.trim() || 'this book'}" from your list? This action cannot be undone.
                        </Text>

                        <View style={localStyles.buttonRow}>
                            <TouchableOpacity 
                                style={[localStyles.actionButton, localStyles.cancelButton]} 
                                onPress={() => setDeletePopupVisible(false)}
                            >
                                <Text style={[localStyles.buttonText, { color: theme.text }]}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[localStyles.actionButton, localStyles.deleteButton]} 
                                onPress={handleDeleteBook}
                            >
                                <Text style={[localStyles.buttonText, { color: '#FFF' }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ─── LOCAL STYLES FOR MODALS ─────────────────────────────────────────────────
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
