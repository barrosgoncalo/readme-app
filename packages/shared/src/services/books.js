import { createUserBookModel } from "../models/book";
import ImageColors from 'react-native-image-colors';

import { DB } from "./DB"; // Adjust path as needed

class BookCollectionService {

    constructor(collectionName) {
        this.collectionName = collectionName; 
    }

    /**
     * Orchestrates the global cache validation and lightweight link creation.
     * @param {string} uid - The authenticated user's ID
     * @param {Object} globalBookData - The full book payload returned from your adapters
     * @param {string} status - Initial reading status ('reading' or 'done')
     * @param {Object} overrides - Any optional page modifications or custom values
     */
    // Inside your BookCollectionService class...
    async saveBookToShelf(uid, globalBookData, status = 'reading', overrides = {}) {
        console.log("[PAGE TRACKER 3 - Database Entry] Data received by DB:", JSON.stringify(globalBookData).substring(0, 200));

        let finalOverrides = { ...overrides };

        // Safely grab the bookId
        const bookId = String(globalBookData.bookId || globalBookData.id);
        const cleanGlobalBook = JSON.parse(JSON.stringify(globalBookData));

        // Force extraction
        const extractedPages = 
            globalBookData.pageCount || 
                globalBookData.volumeInfo?.pageCount || 
                globalBookData.volumeInfo?.printedPageCount || 
                0;

        console.log(`[PAGE TRACKER 4 - Extraction] Extracted exactly: ${extractedPages} pages`);

        // Force clean fields onto the Global Book object
        cleanGlobalBook.bookId = bookId;
        cleanGlobalBook.addedBy = uid;
        cleanGlobalBook.createdAt = new Date().toISOString();
        cleanGlobalBook.pageCount = extractedPages; 

        const existingGlobalBook = await DB.get("books", bookId);

        if (!existingGlobalBook) {
            await DB.create("books", cleanGlobalBook, bookId);
        }

        finalOverrides.pageCount = extractedPages;

        const userBookLink = createUserBookModel(uid, bookId, status, finalOverrides);
        const { createdAt, ...restOfLink } = userBookLink;
        const cleanUserLink = { ...JSON.parse(JSON.stringify(restOfLink)), createdAt };

        // Force onto the user link document as well
        cleanUserLink.pageCount = extractedPages;
        console.log(`[PAGE TRACKER 5 - Final Save] Saving user doc with pages: ${cleanUserLink.pageCount}`);

        const subcollectionPath = `users/${uid}/${this.collectionName}`;
        await DB.create(subcollectionPath, cleanUserLink, bookId);

        return cleanUserLink;
    }

    /**
     * Deletes a book from the user's specific shelf.
     */
    async deleteBook(userId, bookId) {
        try {
            const subcollectionPath = `users/${userId}/${this.collectionName}`;
            console.log(`[Delete] Attempting to remove book ${bookId} from /${subcollectionPath}`);
            
            await DB.remove(subcollectionPath, bookId);
            
            console.log(`[Delete] SUCCESS: Removed book from ${this.collectionName}.`);
        } catch (error) {
            console.error(`Error deleting book ${bookId} from ${this.collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Generically updates specific fields of a book on the user's shelf.
     */
    async updateBook(uid, bookId, updates) {
        try {
            const subcollectionPath = `users/${uid}/${this.collectionName}`;
            console.log(`[Update] Attempting to update fields for ${bookId}:`, updates);
            
            await DB.update(subcollectionPath, bookId, updates);
            
            console.log(`[Update] SUCCESS: Updated book fields in ${this.collectionName}.`);
        } catch (error) {
            console.error(`Error updating book ${bookId} in ${this.collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Fetches the user's lightweight shelf data and populates it with 
     * matching global metadata from the general books database.
     */
    async getBooks(uid) {
        const subcollectionPath = `users/${uid}/${this.collectionName}`;
        
        const userShelfBooks = await DB.get(subcollectionPath, []);

        const fetchPromises = userShelfBooks.map(async (userTrackingData) => {
            const bookId = userTrackingData.id;

            const globalBookData = await DB.get("books", bookId);

            return {
                ...userTrackingData,
                bookDetails: globalBookData || null
            };
        });

        return await Promise.all(fetchPromises);
    }
}

export const FavoriteBooksService = new BookCollectionService("favoriteBooks");
export const MyBooksService = new BookCollectionService("myBooks");

export const GlobalBooksService = {
    /**
     * Checks if a book already exists in our global Firebase cache by ISBN
     */
    async getBookByIsbn(isbn) {
        try {
            const cleanIsbn = String(isbn).replace(/[- ]/g, '');
            const targetField = cleanIsbn.length === 13 ? 'isbn13' : 'isbn10';
            
            console.log(`[Cache Search] Checking global cache field '${targetField}' for barcode: ${cleanIsbn}`);
            
            const matches = await DB.get('books', [
                { field: targetField, operator: '==', value: cleanIsbn }
            ]);

            if (matches.length > 0) {
                console.log(`[Cache Hit] Perfect match found in Firebase for ${targetField}: ${cleanIsbn}!`);
                return matches[0];
            }
            
            console.log(`[Cache Miss] Barcode ${cleanIsbn} not found in system. Fetching from APIs...`);
            return null;
        } catch (error) {
            console.error("Error checking global cache:", error);
            return null;
        }
    }
};
