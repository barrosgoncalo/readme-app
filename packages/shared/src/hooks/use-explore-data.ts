import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { doGetBlockedUids } from '../services/block';
import { PublicationService } from '../services/publications';
import { ChatService } from '../services/chat';

import { UsersService } from '../services/users';

export function useExploreData(currentUserId) {
    const [books, setBooks] = useState([]);
    const [userFavorites, setUserFavorites] = useState([]);
    const [activeChats, setActiveChats] = useState([]);
    const [isLoadingBooks, setIsLoadingBooks] = useState(true);

    // --- Active chats (real-time) ---
    useEffect(() => {
        if (!currentUserId) {
            setActiveChats([]);
            return;
        }

        const unsubscribe = ChatService.subscribeToActiveChats(
            currentUserId,
            setActiveChats,
            (error) => console.error("Error loading active chats:", error)
        );

        return () => unsubscribe();
    }, [currentUserId]);

    // --- Publications ---
    const fetchPublications = useCallback(async (showSpinner = true) => {
        try {
            if (showSpinner) setIsLoadingBooks(true);

            let blockedUids = [];
            if (currentUserId) {
                blockedUids = await doGetBlockedUids(currentUserId);
            }

            const fetchedBooks = await PublicationService.fetchExplorePublications(currentUserId, blockedUids);
            setBooks(fetchedBooks);
        } catch (error) {
            console.error("Erro a carregar publicações:", error);
        } finally {
            if (showSpinner) setIsLoadingBooks(false);
        }
    }, [currentUserId]);

    // --- Favorites ---
    const fetchUserFavorites = useCallback(async () => {
        if (!currentUserId) return;
        try {
            // 2. Call the method explicitly from the service
            const favorites = await UsersService.fetchUserFavorites(currentUserId);
            setUserFavorites(favorites);
        } catch (error) {
            console.error("Failed to load user favorites:", error);
        }
    }, [currentUserId]);

    // --- Trigger fetches on focus ---
    useFocusEffect(
        useCallback(() => {
            if (currentUserId) {
                const isInitialLoad = books.length === 0;
                fetchPublications(isInitialLoad);
                fetchUserFavorites();
            }
        }, [currentUserId, books.length, fetchPublications, fetchUserFavorites])
    );

    // --- Actions ---
    const handleToggleFavorite = useCallback(async (bookId, currentIsFavorite, currentCount) => {
        if (!currentUserId) {
            console.warn("User must be logged in to favorite a book.");
            return;
        }

        setBooks(prevBooks =>
            prevBooks.map(book => {
                if (book.id === bookId) {
                    return {
                        ...book,
                        isFavorite: !currentIsFavorite,
                        favoriteCount: !currentIsFavorite ? currentCount + 1 : Math.max(0, currentCount - 1)
                    };
                }
                return book;
            })
        );

        try {
            await PublicationService.toggleFavorite(currentUserId, bookId, currentIsFavorite);
        } catch (error) {
            console.error("Failed to like book:", error);
        }
    }, [currentUserId]);

    return {
        books,
        userFavorites,
        activeChats,
        isLoadingBooks,
        handleToggleFavorite,
    };
}
