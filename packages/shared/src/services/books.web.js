// Web variant of books.js — mirrors the export surface, but imports the
// browser Firebase entry. Keep in sync with books.js when changing.
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase.web';

class BookCollectionService {
    constructor(collectionName) {
        this.collectionName = collectionName;
    }

    async addBook(uid, bookId) {
        const bookRef = doc(db, 'users', uid, this.collectionName, bookId);
        await setDoc(bookRef, {
            bookId,
            addedAt: new Date().toISOString(),
        });
    }

    async removeBook(uid, bookId) {
        const bookRef = doc(db, 'users', uid, this.collectionName, bookId);
        await deleteDoc(bookRef);
    }

    async getBooks(uid) {
        const booksRef = collection(db, 'users', uid, this.collectionName);
        const snapshot = await getDocs(booksRef);
        return snapshot.docs.map((d) => d.id);
    }
}

export const favoriteBooksService = new BookCollectionService('favoriteBooks');
export const myBooksService = new BookCollectionService('myBooks');
