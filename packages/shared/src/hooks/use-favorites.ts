import { useState, useCallback } from 'react';
import { UsersService } from '../services/users';
import { PublicationService } from '../services/publications';

export function useFavorites(currentUserId) {
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFavoriteBooks = useCallback(async () => {
        if (!currentUserId) return;
        setIsLoading(true);

        try {
            const favoriteIds = await UsersService.fetchUserFavorites(currentUserId);
            const fetchedFavorites = await PublicationService.fetchPublicationsByIds(favoriteIds);

            setFavorites(fetchedFavorites.map(book => ({ ...book, isFavorite: true })));
        } catch (error) {
            console.error("Error fetching favorites:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUserId]);

    const handleRemoveFavorite = useCallback(async (bookId, currentIsFavorite) => {
        setFavorites(prev => prev.filter(book => book.id !== bookId));

        try {
            await UsersService.toggleFavoriteStatus(currentUserId, bookId, currentIsFavorite);
        } catch (error) {
            console.error("Failed to remove favorite:", error);
            fetchFavoriteBooks();
        }
    }, [currentUserId, fetchFavoriteBooks]);

    return {
        favorites,
        isLoading,
        fetchFavoriteBooks,
        handleRemoveFavorite,
    };
}
