// hooks/useRecentSearches.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import {
    getRecentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
} from '@readme/shared/src/services/recentSearches';

export function useRecentSearches(type) {
    const { currentUser } = useAuth();
    const [recentSearches, setRecentSearches] = useState([]);

    useEffect(() => {
        if (!currentUser) {
            setRecentSearches([]);
            return;
        }
        getRecentSearches(type, currentUser.uid).then(setRecentSearches);
    }, [type, currentUser]);

    const saveRecentSearch = useCallback(async (query) => {
        if (!currentUser) return;
        const updated = await addRecentSearch(type, currentUser.uid, query);
        setRecentSearches(updated);
    }, [type, currentUser]);

    const removeRecent = useCallback(async (query) => {
        if (!currentUser) return;
        const updated = await removeRecentSearch(type, currentUser.uid, query);
        setRecentSearches(updated);
    }, [type, currentUser]);

    const clearRecents = useCallback(async () => {
        if (!currentUser) return;
        await clearRecentSearches(type, currentUser.uid);
        setRecentSearches([]);
    }, [type, currentUser]);

    return { recentSearches, saveRecentSearch, removeRecent, clearRecents };
}