// @readme/shared/src/services/books.js
//
// Shared per-user shelf service (myBooks / favoriteBooks subcollections) +
// the global /books cache helper. Used by both web and mobile.
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs, updateDoc, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { createUserBookModel } from "../models/book";
// RN-native module. On web, vite resolve.alias points this at a stub that
// rejects — extractCoverColor catches the error and returns the fallback.
import ImageColors from 'react-native-image-colors';

async function extractCoverColor(coverUrl) {
    try {
        const colors = await ImageColors.getColors(coverUrl, {
            fallback: '#F58B2E',
            cache: true,
            key: coverUrl,
        });
        let color;
        if (colors.platform === 'android') {
            color = colors.vibrant || colors.average || colors.dominant || '#F58B2E';
        } else if (colors.platform === 'ios') {
            color = colors.background || colors.detail || colors.primary || '#F58B2E';
        }
        if (color === '#000000' || color === '#FFFFFF') color = '#F58B2E';
        return color || '#F58B2E';
    } catch {
        return '#F58B2E';
    }
}

class BookCollectionService {
    constructor(collectionName) {
        this.collectionName = collectionName;
    }

    // ── Mobile-style: orchestrates global cache check + shelf write, with
    //    cover-color extraction (RN only; falls back to default on web).
    async saveBookToShelf(uid, globalBookData, status = 'want_to_read', overrides = {}) {
        const finalOverrides = { ...overrides };
        if (!finalOverrides.color && globalBookData.coverUrl) {
            finalOverrides.color = await extractCoverColor(globalBookData.coverUrl);
        }

        const bookId = String(globalBookData.bookId);
        const cleanGlobalBook = JSON.parse(JSON.stringify(globalBookData));
        cleanGlobalBook.bookId = bookId;
        cleanGlobalBook.addedBy = uid;
        cleanGlobalBook.createdAt = new Date().toISOString();

        const globalBookRef = doc(db, "books", bookId);
        const globalBookSnap = await getDoc(globalBookRef);
        if (!globalBookSnap.exists()) {
            await setDoc(globalBookRef, cleanGlobalBook);
        }

        const userBookLink = createUserBookModel(uid, bookId, status, finalOverrides);
        const cleanUserLink = JSON.parse(JSON.stringify(userBookLink));
        const userBookRef = doc(db, "users", uid, this.collectionName, bookId);
        await setDoc(userBookRef, cleanUserLink);
        return cleanUserLink;
    }

    // ── Web-style: simple shelf write. Caller is responsible for the global
    //    /books entry (use createBookIfMissing from booksCatalog.js).
    async addBook(uid, bookId, extraData = {}) {
        const bookRef = doc(db, 'users', uid, this.collectionName, bookId);
        await setDoc(bookRef, {
            bookId,
            addedAt: new Date().toISOString(),
            ...extraData,
        });
    }

    async deleteBook(uid, bookId) {
        const bookRef = doc(db, 'users', uid, this.collectionName, bookId);
        await deleteDoc(bookRef);
    }

    // Alias for deleteBook — kept so web callers don't have to rename.
    async removeBook(uid, bookId) {
        return this.deleteBook(uid, bookId);
    }

    async updateBook(uid, bookId, updates) {
        const bookRef = doc(db, "users", uid, this.collectionName, bookId);
        await updateDoc(bookRef, updates);
    }

    // Returns user shelf entries merged with the global /books metadata
    // (each entry has a `bookDetails` field with the global doc data).
    async getBooks(uid) {
        const booksRef = collection(db, "users", uid, this.collectionName);
        const snapshot = await getDocs(booksRef);
        return Promise.all(snapshot.docs.map(async (userDoc) => {
            const userTrackingData = userDoc.data();
            const globalBookSnap = await getDoc(doc(db, "books", userDoc.id));
            return {
                ...userTrackingData,
                bookDetails: globalBookSnap.exists() ? globalBookSnap.data() : null,
            };
        }));
    }

    // Just the IDs of every book on this shelf — cheaper than getBooks/getBooksData
    // when the caller only needs membership info (e.g. favorites set).
    async getBookIds(uid) {
        const data = await this.getBooksData(uid);
        return data.map((d) => d.id);
    }

    // Raw subcollection docs ({ id, bookId, addedAt, ...rest }). No global join.
    async getBooksData(uid) {
        const booksRef = collection(db, 'users', uid, this.collectionName);
        const snapshot = await getDocs(booksRef);
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    async getBookData(uid, bookId) {
        const snap = await getDoc(doc(db, 'users', uid, this.collectionName, bookId));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    }
}

export const favoriteBooksService = new BookCollectionService("favoriteBooks");
export const myBooksService = new BookCollectionService("myBooks");

export const globalBooksService = {
    // Checks the global /books cache by ISBN-10 or ISBN-13.
    // Returns the matched book (with `bookId`) or null.
    async getBookByIsbn(isbn) {
        try {
            const cleanIsbn = String(isbn).replace(/[- ]/g, '');
            const targetField = cleanIsbn.length === 13 ? 'isbn13' : 'isbn10';
            const q = query(collection(db, 'books'), where(targetField, '==', cleanIsbn));
            const snap = await getDocs(q);
            if (snap.empty) return null;
            const bookDoc = snap.docs[0];
            return { ...bookDoc.data(), bookId: bookDoc.id };
        } catch (error) {
            console.error("Error checking global cache:", error);
            return null;
        }
    }
};
