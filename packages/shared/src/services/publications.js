import { DB } from './DB';
import { PUBLICATION_STATUS } from '../constants/status';

/**
 * Fetches all books belonging to a specific user UID
 */
export const fetchUserPublications = async (userId) => {
    return await DB.get('publications', [
        { field: 'uid', operator: '==', value: userId }
    ]);
};

/**
 * Hard deletes books from the database after a successful swap
 */
export const deleteBooksAfterSwap = async (targetBookId, finalSelectedBookId) => {
    try {
        console.log("--- STARTING BOOK DELETION ---");
        console.log("1. Target Book ID:", targetBookId);
        console.log("2. Selected Book ID:", finalSelectedBookId);

        if (targetBookId) {
            console.log(`Attempting to delete Target Book...`);
            await DB.remove('publications', targetBookId);
            console.log(`Target Book deleted successfully!`);
        }

        if (finalSelectedBookId) {
            console.log(`Attempting to delete Selected Book...`);
            await DB.remove('publications', finalSelectedBookId);
            console.log(`Selected Book deleted successfully!`);
        }

        console.log("--- ALL BOOKS DELETED ---");
        return { success: true };
    } catch (error) {
        console.error("🔥 ERROR DELETING BOOKS:", error.message || error);
        throw error; 
    }
};
