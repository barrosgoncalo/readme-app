// @readme/shared/src/services/books.js
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { createUserBookModel } from "../models/book";

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

        const userBookLink = createUserBookModel(uid, bookId, status, overrides);
        const cleanUserLink = JSON.parse(JSON.stringify(userBookLink));

        const userBookRef = doc(db, "users", uid, this.collectionName, bookId);
        
        console.log(`[Step 2] Attempting write to user shelf: /users/${uid}/${this.collectionName}/${bookId}`);
        await setDoc(userBookRef, cleanUserLink);
        console.log(`[Step 2] SUCCESS: Saved to user shelf subcollection.`);

        return cleanUserLink;
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

// Specific instances mapping to their specific subcollections
export const favoriteBooksService = new BookCollectionService("favoriteBooks");
export const myBooksService = new BookCollectionService("myBooks");
