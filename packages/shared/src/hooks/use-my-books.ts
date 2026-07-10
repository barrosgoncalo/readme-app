import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';

import { PublicationService } from '../services/publications';

export function useMyBooks() {
    const [myBooks, setMyBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadBooks = async () => {
            const auth = getAuth();
            if (!auth.currentUser) {
                setLoading(false);
                return;
            }

            try {
                const books = await PublicationService.fetchUserPublications(auth.currentUser.uid);
                setMyBooks(books);
            } catch (err) {
                setError(err);
                console.error("Failed to fetch user books:", err);
            } finally {
                setLoading(false);
            }
        };

        loadBooks();
    }, []);

    return { myBooks, loading, error };
}
