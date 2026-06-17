// // @readme/shared/src/services/books.js
import { doc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

// generic class
class BookCollectionService {

    constructor(collectionName) {
        this.collectionName = collectionName; 
    }

    async addBook(uid, bookId) {
        const bookRef = doc(db, "users", uid, this.collectionName, bookId);
        await setDoc(bookRef, {
            bookId: bookId,
            addedAt: new Date().toISOString()
        });
    }

    async removeBook(uid, bookId) {
        const bookRef = doc(db, "users", uid, this.collectionName, bookId);
        await deleteDoc(bookRef);
    }

    async getBooks(uid) {
        const booksRef = collection(db, "users", uid, this.collectionName);
        const snapshot = await getDocs(booksRef);
        return snapshot.docs.map(doc => doc.id);
    }
}

// specific instances
export const favoriteBooksService = new BookCollectionService("favoriteBooks");
export const myBooksService = new BookCollectionService("myBooks");
