// use-my-postings.ts
import { useState, useCallback } from 'react';
import { useMyBooks } from './use-my-books';
import { UsersService } from '../services/users';

export function useMyPostings(currentUserId) {
    const { myBooks: rawBooks, loading: isLoading, refetch } = useMyBooks();
    const [favoriteIds, setFavoriteIds] = useState([]);

    const fetchMyPostings = useCallback(async () => {
        if (!currentUserId) return;

        const [_, favorites] = await Promise.all([
            refetch(),
            UsersService.fetchUserFavorites(currentUserId),
        ]);
        setFavoriteIds(favorites);
    }, [currentUserId, refetch]);

    const myBooks = rawBooks.map(book => ({
        ...book,
        isFavorite: favoriteIds.includes(book.id)
    }));

    const handleToggleFavorite = useCallback(async (bookId, currentIsFavorite) => {
        setFavoriteIds(prev =>
            currentIsFavorite ? prev.filter(id => id !== bookId) : [...prev, bookId]
        );

        try {
            await UsersService.toggleFavoriteStatus(currentUserId, bookId, currentIsFavorite);
        } catch (error) {
            console.error("Failed to toggle favorite status:", error);
            fetchMyPostings();
        }
    }, [currentUserId, fetchMyPostings]);

    return {
        myBooks,
        isLoading,
        fetchMyPostings,
        handleToggleFavorite,
    };
}
