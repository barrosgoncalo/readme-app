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

export async function getBookByIsbn(isbn) {
    if (!isbn) return null;
    const cleanIsbn = String(isbn).replace(/[- ]/g, '');
    const targetField = cleanIsbn.length === 13 ? 'isbn13' : 'isbn10';
    const q = query(collection(db, COLLECTION), where(targetField, '==', cleanIsbn));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
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
