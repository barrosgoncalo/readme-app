// @readme/shared/src/services/recentSearches.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_RECENTS = 10;
const storageKey = (type, uid) => `recent_searches:${type}:${uid}`;

export const RECENT_SEARCH_TYPES = { BOOKS: 'books', PEOPLE: 'people' };

const normalize = (q) => q.trim();

export const getRecentSearches = async (type, uid) => {
    if (!uid) return [];
    try {
        const raw = await AsyncStorage.getItem(storageKey(type, uid));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const addRecentSearch = async (type, uid, query) => {
    const q = normalize(query);
    if (!uid || !q) return [];

    const existing = await getRecentSearches(type, uid);
    const deduped = existing.filter((e) => e.toLowerCase() !== q.toLowerCase());
    const updated = [q, ...deduped].slice(0, MAX_RECENTS);

    await AsyncStorage.setItem(storageKey(type, uid), JSON.stringify(updated));
    return updated;
};

export const removeRecentSearch = async (type, uid, query) => {
    const existing = await getRecentSearches(type, uid);
    const updated = existing.filter((e) => e.toLowerCase() !== normalize(query).toLowerCase());
    await AsyncStorage.setItem(storageKey(type, uid), JSON.stringify(updated));
    return updated;
};

export const clearRecentSearches = async (type, uid) => {
    await AsyncStorage.removeItem(storageKey(type, uid));
};