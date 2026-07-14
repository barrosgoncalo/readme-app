// use-favorite-status.js
import { useState, useCallback, useEffect } from 'react';
import { UsersService } from '../services/users';

export function useFavoriteStatus(currentUserId) {
    const [favoriteIds, setFavoriteIds] = useState(() => new Set());

    const refreshFavorites = useCallback(async () => {
        if (!currentUserId) { setFavoriteIds(new Set()); return; }
        try {
            const favorites = await UsersService.fetchUserFavorites(currentUserId);
            setFavoriteIds(new Set(favorites));
        } catch (e) {
            console.error('Failed to load user favorites:', e);
        }
    }, [currentUserId]);

    useEffect(() => { refreshFavorites(); }, [refreshFavorites]);

    /**
     * @param {string} bookId
     * @param {(id: string, updater: (item: any) => any) => void} [patchItem]
     *   Pass a feed's `updateItem` here to optimistically bump that item's
     *   favoriteCount in place. Optional — omit if you don't need it.
     */
    const toggleFavorite = useCallback(async (bookId, patchItem) => {
        if (!currentUserId) {
            console.warn('User must be logged in to favorite a book.');
            return;
        }
        const wasFavorite = favoriteIds.has(bookId);

        setFavoriteIds((prev) => {
            const next = new Set(prev);
            wasFavorite ? next.delete(bookId) : next.add(bookId);
            return next;
        });
        patchItem?.(bookId, (item) => ({
            ...item,
            favoriteCount: wasFavorite
                ? Math.max(0, (item.favoriteCount || 0) - 1)
                : (item.favoriteCount || 0) + 1,
        }));

        try {
            await UsersService.toggleFavoriteStatus(currentUserId, bookId, wasFavorite);
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
            // roll back both the Set and the item patch on failure
            setFavoriteIds((prev) => {
                const next = new Set(prev);
                wasFavorite ? next.add(bookId) : next.delete(bookId);
                return next;
            });
            patchItem?.(bookId, (item) => ({
                ...item,
                favoriteCount: wasFavorite
                    ? (item.favoriteCount || 0) + 1
                    : Math.max(0, (item.favoriteCount || 0) - 1),
            }));
        }
    }, [currentUserId, favoriteIds]);

    return { favoriteIds, toggleFavorite, refreshFavorites };
}