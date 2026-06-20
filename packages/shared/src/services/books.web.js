// Web variant of books.js — mirrors the export surface, but imports the
// browser Firebase entry. Keep in sync with books.js when changing.
import { doc, getDoc, setDoc, deleteDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase.web';

class BookCollectionService {
    constructor(collectionName) {
        this.collectionName = collectionName;
    }

    async addBook(uid, bookId, extraData = {}) {
        const bookRef = doc(db, 'users', uid, this.collectionName, bookId);
        await setDoc(bookRef, {
            bookId,
            addedAt: new Date().toISOString(),
            ...extraData,
        });
    }

    async removeBook(uid, bookId) {
        const bookRef = doc(db, 'users', uid, this.collectionName, bookId);
        await deleteDoc(bookRef);
    }

    // Returns just IDs (backward-compat for favoriteBooks).
    async getBooks(uid) {
        const data = await this.getBooksData(uid);
        return data.map((d) => d.id);
    }

    // Returns full subcollection docs: { id, bookId, addedAt, ...rest }.
    async getBooksData(uid) {
        const booksRef = collection(db, 'users', uid, this.collectionName);
        const snapshot = await getDocs(booksRef);
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    async getBookData(uid, bookId) {
        const snap = await getDoc(doc(db, 'users', uid, this.collectionName, bookId));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    }

    async updateBook(uid, bookId, updates) {
        const bookRef = doc(db, 'users', uid, this.collectionName, bookId);
        await updateDoc(bookRef, updates);
    }
}

export const favoriteBooksService = new BookCollectionService('favoriteBooks');
export const myBooksService = new BookCollectionService('myBooks');
