// @readme/shared/src/services/books.js
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs, updateDoc, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { createUserBookModel } from "../models/book";
import ImageColors from 'react-native-image-colors';

class BookCollectionService {

    constructor(collectionName) {
        this.collectionName = collectionName; 
    }

    /**
     * Orchestrates the global cache validation and lightweight link creation.
     * @param {string} uid - The authenticated user's ID
     * @param {Object} globalBookData - The full book payload returned from your adapters
     * @param {string} status - Initial reading status ('reading', 'want_to_read', etc.)
     * @param {Object} overrides - Any optional page modifications or custom values
     */
    async saveBookToShelf(uid, globalBookData, status = 'want_to_read', overrides = {}) {
        let finalOverrides = { ...overrides };

        // We now correctly use globalBookData instead of 'book'
        if (!finalOverrides.color && globalBookData.coverUrl) {
            try {
                const colors = await ImageColors.getColors(globalBookData.coverUrl, {
                    fallback: '#F58B2E', 
                    cache: true,
                    key: globalBookData.coverUrl,
                });

                // Let's log exactly what the library is finding
                console.log("Extracted Color Palette:", colors);

                if (colors.platform === 'android') {
                    // Try vibrant or average first, then dominant, then fallback
                    finalOverrides.color = colors.vibrant || colors.average || colors.dominant || '#F58B2E';
                } else if (colors.platform === 'ios') {
                    // On iOS, 'background' or 'detail' usually look better for book covers than 'primary'
                    finalOverrides.color = colors.background || colors.detail || colors.primary || '#F58B2E'; 
                }

                // Safety check: If it somehow grabbed pure black or white, force the fallback
                if (finalOverrides.color === '#000000' || finalOverrides.color === '#FFFFFF') {
                    finalOverrides.color = '#F58B2E';
                }

            } catch (error) {
                console.log("Service: Could not extract image color, skipping...", error);
                finalOverrides.color = '#F58B2E';
            }
        }

        const bookId = String(globalBookData.bookId);
        const cleanGlobalBook = JSON.parse(JSON.stringify(globalBookData));
        cleanGlobalBook.bookId = bookId;

        const globalBookRef = doc(db, "books", bookId);
        const globalBookSnap = await getDoc(globalBookRef);

        if (!globalBookSnap.exists()) {
            console.log(`[Step 1] Attempting write to global database: /books/${bookId}`);
            await setDoc(globalBookRef, cleanGlobalBook);
            console.log(`[Step 1] SUCCESS: Saved to global /books collection.`);
        } else {
            console.log(`[Step 1] CACHE HIT: "/books/${bookId}" already exists. Skipping global write.`);
        }

        // 2. We must pass finalOverrides here, NOT the original overrides, 
        // otherwise the newly extracted color gets left behind!
        const userBookLink = createUserBookModel(uid, bookId, status, finalOverrides);
        const cleanUserLink = JSON.parse(JSON.stringify(userBookLink));

        const userBookRef = doc(db, "users", uid, this.collectionName, bookId);
        
        console.log(`[Step 2] Attempting write to user shelf: /users/${uid}/${this.collectionName}/${bookId}`);
        await setDoc(userBookRef, cleanUserLink);
        console.log(`[Step 2] SUCCESS: Saved to user shelf subcollection.`);

        return cleanUserLink;
    }

    /**
     * Deletes a book from the user's specific shelf.
     * @param {string} userId - The authenticated user's ID
     * @param {string} bookId - The ID of the book to delete
     */
    async deleteBook(userId, bookId) {
        try {
            // Use this.collectionName to dynamically target 'myBooks' or 'favoriteBooks'
            const bookRef = doc(db, 'users', userId, this.collectionName, bookId);

            console.log(`[Delete] Attempting to remove book ${bookId} from /users/${userId}/${this.collectionName}`);
            await deleteDoc(bookRef);
            console.log(`[Delete] SUCCESS: Removed book from ${this.collectionName}.`);
        } catch (error) {
            console.error(`Error deleting book ${bookId} from ${this.collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Generically updates specific fields of a book on the user's shelf.
     * @param {string} uid - The authenticated user's ID
     * @param {string} bookId - The ID of the book to update
     * @param {Object} updates - An object containing the fields to update
     */
    async updateBook(uid, bookId, updates) {
        try {
            const bookRef = doc(db, "users", uid, this.collectionName, bookId);

            console.log(`[Update] Attempting to update fields for ${bookId}:`, updates);
            await updateDoc(bookRef, updates);
            console.log(`[Update] SUCCESS: Updated book fields in ${this.collectionName}.`);

        } catch (error) {
            console.error(`Error updating book ${bookId} in ${this.collectionName}:`, error);
            throw error; // Rethrow so your UI can catch and show an alert if needed
        }
    }

    /**
     * Fetches the user's lightweight shelf data and populates it with 
     * matching global metadata from the general books database.
     */
    async getBooks(uid) {
        // 1. Fetch the user's lightweight shelf data (the tracking pointers)
        const booksRef = collection(db, "users", uid, this.collectionName);
        const snapshot = await getDocs(booksRef);

        // 2. Fetch the global book data for each item in parallel for speed
        const fetchPromises = snapshot.docs.map(async (userDoc) => {
            const userTrackingData = userDoc.data(); // Contains status, currentPage, color, etc.
            const bookId = userDoc.id;

            // Fetch the immutable details from the general books collection
            const globalBookRef = doc(db, "books", bookId);
            const globalBookSnap = await getDoc(globalBookRef);

            // 3. Merge them together into one populated object for your UI
            return {
                ...userTrackingData,
                bookDetails: globalBookSnap.exists() ? globalBookSnap.data() : null
            };
        });

        // Wait for all fetches to finish and return the array
        const populatedBooks = await Promise.all(fetchPromises);
        return populatedBooks;
    }
}

export const favoriteBooksService = new BookCollectionService("favoriteBooks");
export const myBooksService = new BookCollectionService("myBooks");

export const globalBooksService = {
    /**
     * Checks if a book already exists in our global Firebase cache by ISBN
     * @param {string} isbn - The scanned barcode number
     * @returns {Object|null} - Returns the formatted book object if found, or null if not
     */
    async getBookByIsbn(isbn) {
        try {
            const booksRef = collection(db, 'books');
            
            // 1. Sanitize the string just in case there are unexpected dashes or spaces
            const cleanIsbn = String(isbn).replace(/[- ]/g, '');
            
            // 2. Dynamically choose the correct field to search based on your adapter keys!
            const targetField = cleanIsbn.length === 13 ? 'isbn13' : 'isbn10';
            
            console.log(`[Cache Search] Checking global cache field '${targetField}' for barcode: ${cleanIsbn}`);
            
            const q = query(booksRef, where(targetField, '==', cleanIsbn)); 
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                console.log(`[Cache Hit] Perfect match found in Firebase for ${targetField}: ${cleanIsbn}!`);
                const bookDoc = querySnapshot.docs[0];
                return { ...bookDoc.data(), bookId: bookDoc.id };
            }
            
            console.log(`[Cache Miss] Barcode ${cleanIsbn} not found in system. Fetching from external APIs...`);
            return null;
        } catch (error) {
            console.error("Error checking global cache:", error);
            return null;
        }
    }
};
