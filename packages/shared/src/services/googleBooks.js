// @readme/shared/src/services/googleBooksService.js
//
import { mapGoogleBook, mapOpenLibraryBook } from '../models/book';

const GOOGLE_BOOKS_BASE_URL = 'https://www.googleapis.com/books/v1/volumes';
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;

// Strip non-digits so we can compare ISBNs regardless of hyphens/spaces.
const normalizeIsbn = (value) => (value || '').replace(/[^0-9Xx]/g, '').toUpperCase();

// Confirms the item Google returned is actually the edition we searched for,
// not just a loosely-related fuzzy match (different edition/printing/region).
const matchesRequestedIsbn = (item, requestedIsbn) => {
    const target = normalizeIsbn(requestedIsbn);
    const ids = item?.volumeInfo?.industryIdentifiers || [];
    return ids.some(id => normalizeIsbn(id.identifier) === target);
};

export const GoogleBooksService = {

    async getBookByIsbn(isbn) {
        try {
            let googleBook = null;

            // --- Strict ISBN search ---
            const strictUrl = `${GOOGLE_BOOKS_BASE_URL}?q=isbn:${isbn}&key=${API_KEY}`;
            const strictRes = await fetch(strictUrl);
            const strictData = await strictRes.json();

            if (strictData.items && strictData.items.length > 0) {
                googleBook = mapGoogleBook(strictData.items[0]);
            } else {
                // --- Fuzzy fallback search ---
                // Only used if strict search found nothing. The fuzzy query can
                // surface a different edition of the same book, so we verify the
                // ISBN actually matches before trusting the result.
                const fuzzyUrl = `${GOOGLE_BOOKS_BASE_URL}?q=${isbn}&maxResults=5&key=${API_KEY}`;
                const fuzzyRes = await fetch(fuzzyUrl);
                const fuzzyData = await fuzzyRes.json();

                const verifiedMatch = fuzzyData.items?.find(item => matchesRequestedIsbn(item, isbn));

                if (verifiedMatch) {
                    googleBook = mapGoogleBook(verifiedMatch);
                }
                // If nothing in the fuzzy results actually matches the requested
                // ISBN, we deliberately leave googleBook as null rather than
                // accepting a same-title-different-edition mismatch.
            }

            if (googleBook && googleBook.coverUrl && googleBook.pageCount > 0) {
                return googleBook;
            }

            // --- Open Library fetch (fills gaps or acts as full fallback) ---
            let openLibraryBook = null;
            const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
            const olResponse = await fetch(olUrl);
            const olData = await olResponse.json();

            const olKey = `ISBN:${isbn}`;
            if (olData[olKey]) {
                openLibraryBook = mapOpenLibraryBook(olData[olKey], isbn);
            }

            // --- Data merge: best available value per field, independently ---
            if (!googleBook && openLibraryBook) return openLibraryBook;
            if (googleBook && !openLibraryBook) return googleBook;

            if (googleBook && openLibraryBook) {
                // Pages: trust Google if it has a real value, else fall back.
                const lockedPageCount = googleBook.pageCount > 0
                    ? googleBook.pageCount
                    : (openLibraryBook.pageCount > 0 ? openLibraryBook.pageCount : 0);

                // Cover: prefer whichever source actually has a real image.
                // (mapGoogleBook no longer fabricates a guessed cover URL, so
                // googleBook.coverUrl is either a real thumbnail or null here.)
                const lockedCoverUrl = googleBook.coverUrl || openLibraryBook.coverUrl;

                // Description: Google's tends to be more complete/readable.
                const lockedDescription = googleBook.description || openLibraryBook.description;

                return {
                    ...googleBook, // foundational fields: title, authors, ISBNs
                    coverUrl: lockedCoverUrl,
                    pageCount: lockedPageCount,
                    description: lockedDescription
                };
            }

            // Neither source found anything usable.
            return null;

        } catch (error) {
            console.error("Error fetching book by ISBN:", error);
            throw error;
        }
    },

    async searchBooks(query) {
        try {
            const url = `${GOOGLE_BOOKS_BASE_URL}?q=${encodeURIComponent(query)}&maxResults=10&key=${API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();

            if (!data.items) return [];

            return data.items.map(item => mapGoogleBook(item));

        } catch (error) {
            console.error("Error searching books:", error);
            throw error;
        }
    }
};
