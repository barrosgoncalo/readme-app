// @readme/shared/src/services/booksCatalog.js
//
// CRUD for the global books/{bookId} catalog. Per-user shelves (myBooks,
// favoriteBooks) live in books.js — this module is the shared catalog only.
import {
    doc, getDoc, setDoc, collection, getDocs, query, where, documentId,
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'books';

export async function getBook(bookId) {
    const snap = await getDoc(doc(db, COLLECTION, bookId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Idempotent — does nothing if the doc already exists.
// Caller must pass the uid as addedBy (rules enforce addedBy == request.auth.uid).
export async function createBookIfMissing(bookId, data) {
    const ref = doc(db, COLLECTION, bookId);
    const existing = await getDoc(ref);
    if (existing.exists()) return;

    await setDoc(ref, {
        isbn: data.isbn || null,
        title: data.title,
        authors: data.authors,
        coverUrl: data.coverUrl || null,
        addedBy: data.addedBy,
        createdAt: new Date().toISOString(),
    });
}

// Firestore's `in` operator is capped at 10 values — chunk and merge.
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
