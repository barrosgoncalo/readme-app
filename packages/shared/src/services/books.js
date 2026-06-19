// @readme/shared/src/services/books.js
import { doc, setDoc, deleteDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

class BookCollectionService {

    constructor(collectionName) {
        this.collectionName = collectionName; 
    }

    /**
     * Saves the full book model to the user's shelf.
     * Uses {merge: true} so if the book already exists, it updates it instead of crashing.
     */
    async saveBook(uid, userBook) {
        // We use userBook.bookId as the document ID so they don't add the same exact book twice
        const bookRef = doc(db, "users", uid, this.collectionName, userBook.bookId);
        
        await setDoc(bookRef, userBook, { merge: true });
    }

    /**
     * Updates specific fields of a book (e.g., updating reading progress)
     */
    async updateBook(uid, bookId, updates) {
        const bookRef = doc(db, "users", uid, this.collectionName, bookId);
        await updateDoc(bookRef, updates);
    }

    async removeBook(uid, bookId) {
        const bookRef = doc(db, "users", uid, this.collectionName, bookId);
        await deleteDoc(bookRef);
    }

    /**
     * Retrieves all books. Now returns the full data objects instead of just IDs!
     */
    async getBooks(uid) {
        const booksRef = collection(db, "users", uid, this.collectionName);
        const snapshot = await getDocs(booksRef);
        // Return the full book data to easily render on the UI
        return snapshot.docs.map(doc => doc.data()); 
    }
}

// specific instances
export const favoriteBooksService = new BookCollectionService("favoriteBooks");
export const myBooksService = new BookCollectionService("myBooks");
