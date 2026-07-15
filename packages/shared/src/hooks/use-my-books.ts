// use-my-books.ts
import { useState, useEffect, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { PublicationService } from '../services/publications';

export function useMyBooks() {
    const [myBooks, setMyBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadBooks = useCallback(async () => {
        const auth = getAuth();
        if (!auth.currentUser) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const books = await PublicationService.fetchUserPublications(auth.currentUser.uid);
            setMyBooks(books);
            setError(null);
        } catch (err) {
            setError(err);
            console.error("Failed to fetch user books:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBooks();
    }, [loadBooks]);

    return { myBooks, loading, error, refetch: loadBooks };
}
