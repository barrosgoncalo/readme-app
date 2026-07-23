import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Image,
} from 'react-native';
import { buildSearchBookStyles } from '../../styles/searchBookStyles';
import { Iconify } from 'react-native-iconify';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { useBookSearch } from '@readme/shared/src/hooks/use-book-search';
import { useSaveBookToShelf } from '@readme/shared/src/hooks/use-save-book-to-shelf';
import { GOOGLE_BOOKS_API_KEY } from '@readme/shared/src/constants/env';
import { normalizeAnyBook } from '@readme/shared/src/models/book'

export default function SearchBookScreen() {
    const navigation = useNavigation();
    const theme = useTheme();
    const styles = buildSearchBookStyles(); 
    const { currentUser } = useAuth();

    const {
        searchQuery, setSearchQuery, searchResults, isLoading, hasSearched, handleSearch
    } = useBookSearch(GOOGLE_BOOKS_API_KEY);

    const { savingBookId, saveBook } = useSaveBookToShelf(currentUser?.uid, navigation);

    // Rendered Items
    const renderBookItem = ({ item }) => {
        // --- NORMALIZE THE ITEM HERE ---
        const book = normalizeAnyBook(item);

        return (
            <View style={[styles.bookCard, { backgroundColor: theme.backgroundElement }]}>
                {book.coverUrl ? (
                    <Image source={{ uri: book.coverUrl }} style={styles.bookCover} />
                ) : (
                    <View style={[styles.bookCover, styles.placeholderCover]}>
                        <Iconify icon="lucide:book" size={28} color="#999" />
                    </View>
                )}

                <View style={styles.bookDetails}>
                    <Text style={[styles.bookTitle, { color: theme.text }]} numberOfLines={2}>
                        {book.title}
                    </Text>
                    <Text style={styles.bookAuthor} numberOfLines={1}>
                        {book.authors && book.authors.length > 0 ? book.authors.join(', ') : 'Unknown Author'}
                    </Text>

                    <View style={styles.actionRow}>
                        <Text style={styles.bookPages}>
                            {book.pageCount > 0 ? `${book.pageCount} pages` : 'Pages unknown'}
                        </Text>

                        <TouchableOpacity 
                            style={[styles.addButton, savingBookId === book.bookId && styles.addingButton]}
                            // Make sure to pass the 'book' (normalized) to saveBook, not 'item'
                            onPress={() => saveBook(book, 'reading')}
                            disabled={savingBookId === book.bookId}
                        >
                            {savingBookId === book.bookId ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Text style={styles.addButtonText}>Add</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header / Search Bar */}
            <View style={[styles.header, { backgroundColor: theme.background }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>

                <View style={[styles.searchContainer, { backgroundColor: theme.backgroundElement }]}>
                    <Iconify icon="lucide:search" size={20} color={theme.textMuted || '#888'} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Search title, author, or ISBN..."
                        placeholderTextColor={theme.textMuted || '#888'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                        autoFocus={true}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={10}>
                            <Iconify icon="lucide:x-circle" size={18} color={theme.textMuted || '#888'} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Content Area */}
            {isLoading ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#F58B2E" />
                    <Text style={[styles.loadingText, { color: theme.textMuted || '#888' }]}>Searching books...</Text>
                </View>
            ) : hasSearched && searchResults.length === 0 ? (
                <View style={styles.centerContent}>
                    <Iconify icon="lucide:search-x" size={48} color={theme.textMuted || '#888'} />
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>No results found</Text>
                    <Text style={[styles.emptySubtext, { color: theme.textMuted || '#888' }]}>
                        We couldn't find any books matching "{searchQuery}".
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={searchResults}
                    // --- FIXED KEY EXTRACTOR --- 
                    // Google books have `item.id`, OpenLibrary fallback uses `item.id` or `item.bookId`
                    keyExtractor={(item, index) => `${item.id || item.bookId || index}`}
                    renderItem={renderBookItem}
                    contentContainerStyle={styles.listContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}
