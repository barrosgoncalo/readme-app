import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { MyBooksService } from '../services/books';

export function useReadingList(currentUserId) {
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBooks = useCallback(async () => {
        if (!currentUserId) return;
        try {
            const userBooks = await MyBooksService.getBooks(currentUserId);
            setBooks(userBooks);
        } catch (error) {
            console.error("Error fetching books:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUserId]);

    useFocusEffect(
        useCallback(() => {
            fetchBooks();
        }, [fetchBooks])
    );

    const handlePageUpdate = async (bookId, newPage, totalPages) => {
        if (!currentUserId) return;

        const safeTotal = totalPages > 0 ? totalPages : 1;
        const boundedPage = Math.min(Math.max(newPage, 0), safeTotal);
        const newPercentage = Math.round((boundedPage / safeTotal) * 100);

        try {
            await MyBooksService.updateBook(currentUserId, bookId, {
                currentPage: boundedPage,
                progressPercentage: newPercentage,
                ...(boundedPage === safeTotal && {
                    status: 'finished',
                    finishedAt: new Date().toISOString()
                })
            });

            setBooks(prevBooks =>
                prevBooks.map(book => {
                    if (book.bookId === bookId) {
                        return {
                            ...book,
                            currentPage: boundedPage,
                            progressPercentage: newPercentage,
                            status: boundedPage === safeTotal ? 'finished' : book.status
                        };
                    }
                    return book;
                })
            );
        } catch (error) {
            console.error("Failed to update page progress:", error);
        }
    };

    const handleDeleteBook = async (book) => {
        if (!currentUserId || !book) return;

        const targetId = book.bookId || book.id;
        if (!targetId) {
            console.error("Could not find a valid ID for this book!");
            return;
        }

        try {
            await MyBooksService.deleteBook(currentUserId, targetId);
            setBooks(prevBooks => prevBooks.filter(b => (b.bookId || b.id) !== targetId));
            return true;
        } catch (error) {
            console.error("Failed to delete book:", error);
            return false;
        }
    };

    return {
        books,
        isLoading,
        fetchBooks,
        handlePageUpdate,
        handleDeleteBook,
    };
}
