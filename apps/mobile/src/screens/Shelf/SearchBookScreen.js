// src/screens/SearchBookScreen.js

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Image,
    Keyboard,
    Alert,
    useColorScheme
} from 'react-native';
import { buildSearchBookStyles } from '../../styles/searchBookStyles';
import { Iconify } from 'react-native-iconify';
import { useNavigation } from '@react-navigation/native';

import { Colors } from '@readme/shared/src/constants/theme';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { GoogleBooksService } from '@readme/shared/src/services/googleBooks';
import { myBooksService } from '@readme/shared/src/services/books';

export default function SearchBookScreen() {
    const navigation = useNavigation();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildSearchBookStyles(); 
    const { currentUser } = useAuth();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [savingBookId, setSavingBookId] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    // Handlers
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        Keyboard.dismiss();
        setIsLoading(true);
        setHasSearched(true);
        setSearchResults([]);

        try {
            const results = await GoogleBooksService.searchBooks(searchQuery);
            setSearchResults(results || []);
        } catch (error) {
            console.error("Search error:", error);
            Alert.alert("Error", "Could not complete the search. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveBook = async (book) => {
        setSavingBookId(book.bookId);

        try {
            await myBooksService.saveBookToShelf(currentUser.uid, book, 'reading');

            Alert.alert(
                'Success!', 
                `"${book.title}" has been added to your shelf.`,
                [{ text: 'OK', onPress: () => navigation.popToTop() }]
            );
        } catch (error) {
            console.error("Save error:", error);
            Alert.alert("Error", "Failed to save the book to your shelf.");
        } finally {
            setSavingBookId(null);
        }
    };

    // Rendered Items
    const renderBookItem = ({ item }) => (
        <View style={[styles.bookCard, { backgroundColor: theme.backgroundElement }]}>
            {item.coverUrl ? (
                <Image source={{ uri: item.coverUrl }} style={styles.bookCover} />
            ) : (
                    <View style={[styles.bookCover, styles.placeholderCover]}>
                        <Iconify icon="lucide:book" size={28} color="#999" />
                    </View>
                )}

            <View style={styles.bookDetails}>
                <Text style={[styles.bookTitle, { color: theme.text }]} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text style={styles.bookAuthor} numberOfLines={1}>
                    {item.authors && item.authors.length > 0 ? item.authors.join(', ') : 'Unknown Author'}
                </Text>

                <View style={styles.actionRow}>
                    <Text style={styles.bookPages}>
                        {item.pageCount > 0 ? `${item.pageCount} pages` : 'Pages unknown'}
                    </Text>

                    <TouchableOpacity 
                        style={[styles.addButton, savingBookId === item.bookId && styles.addingButton]}
                        onPress={() => handleSaveBook(item)}
                        disabled={savingBookId === item.bookId}
                    >
                        {savingBookId === item.bookId ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                                <Text style={styles.addButtonText}>Add</Text>
                            )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

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
                            keyExtractor={(item, index) => `${item.bookId}-${index}`}
                            renderItem={renderBookItem}
                            contentContainerStyle={styles.listContainer}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        />
                    )}
        </View>
    );
}
