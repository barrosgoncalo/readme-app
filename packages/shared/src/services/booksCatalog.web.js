// Web variant of booksCatalog.js — mirrors the export surface, but imports the
// browser Firebase entry. Keep in sync with booksCatalog.js when changing.
import {
    doc, getDoc, setDoc, collection, getDocs, query, where, documentId,
} from 'firebase/firestore';
import { db } from './firebase.web';

const COLLECTION = 'books';

export async function getBook(bookId) {
    const snap = await getDoc(doc(db, COLLECTION, bookId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createBookIfMissing(bookId, data) {
    const ref = doc(db, COLLECTION, bookId);
    const existing = await getDoc(ref);
    if (existing.exists()) return;

    await setDoc(ref, {
        isbn: data.isbn || null,
        title: data.title,
        authors: data.authors,
        coverUrl: data.coverUrl || null,
        description: data.description || null,
        addedBy: data.addedBy,
        createdAt: new Date().toISOString(),
    });
}

/**
 * Checks if a book already exists in the global cache by ISBN. Mirrors
 * GlobalBooksService.getBookByIsbn in services/books.js (mobile's variant),
 * kept here since books.web.js — the web shim main's rewrite left in
 * place — doesn't have it.
 */
export async function getBookByIsbn(isbn) {
    const cleanIsbn = String(isbn).replace(/[- ]/g, '');
    const targetField = cleanIsbn.length === 13 ? 'isbn13' : 'isbn10';

    const q = query(collection(db, COLLECTION), where(targetField, '==', cleanIsbn));
    const snap = await getDocs(q);

    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function getBooksByIds(ids) {
    if (!ids || ids.length === 0) return [];

    const chunks = [];
    for (let i = 0; i < ids.length; i += 10) {
        chunks.push(ids.slice(i, i + 10));
    }

    const results = await Promise.all(
        chunks.map(async (chunk) => {
            const q = query(collection(db, COLLECTION), where(documentId(), 'in', chunk));
            const snap = await getDocs(q);
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        })
    );

    return results.flat();
}
