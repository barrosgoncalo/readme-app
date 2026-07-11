import { useState } from 'react';
import { Alert } from 'react-native';
import { MyBooksService } from '../services/books';

export function useSaveBookToShelf(currentUserId, navigation) {
    const [savingBookId, setSavingBookId] = useState(null);

    const saveBook = async (book, status = 'reading') => {
        setSavingBookId(book.bookId);
        try {
            await MyBooksService.saveBookToShelf(currentUserId, book, status);
            Alert.alert(
                'Success!',
                `"${book.title}" has been added to your shelf.`,
                [{ text: 'OK', onPress: () => navigation.popToTop() }]
            );
            return true;
        } catch (error) {
            console.error("Save error:", error);
            Alert.alert("Error", "Failed to save the book to your shelf.");
            return false;
        } finally {
            setSavingBookId(null);
        }
    };

    return { savingBookId, saveBook };
}
