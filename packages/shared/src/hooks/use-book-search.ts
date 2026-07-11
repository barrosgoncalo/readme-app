import { useState } from 'react';
import { Alert, Keyboard } from 'react-native';
import { GoogleBooksService } from '../services/googleBooks';

export function useBookSearch() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

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

    return {
        searchQuery,
        setSearchQuery,
        searchResults,
        isLoading,
        hasSearched,
        handleSearch,
    };
}
