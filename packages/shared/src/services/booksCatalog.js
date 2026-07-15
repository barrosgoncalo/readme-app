// @readme/shared/src/services/booksCatalog.js
//
// CRUD for the global books/{bookId} catalog. Per-user shelves (myBooks,
// favoriteBooks) live in books.js — this module is the shared catalog only.

import { documentId } from 'firebase/firestore';
import { DB } from './DB';

const COLLECTION = 'books';

export async function getBook(bookId) {
    return await DB.get(COLLECTION, bookId);
}

export async function createBookIfMissing(bookId, data) {
    const existing = await DB.get(COLLECTION, bookId);
    if (existing) return;

    await DB.create(COLLECTION, {
        isbn: data.isbn || null,
        title: data.title,
        authors: data.authors,
        coverUrl: data.coverUrl || null,
        addedBy: data.addedBy,
    }, bookId);
}

export async function getBooksByIds(ids) {
    if (!ids || ids.length === 0) return [];

    return await DB.get(COLLECTION, [
        { field: documentId(), operator: 'in', value: ids }
    ]);
}
