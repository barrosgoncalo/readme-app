// @readme/shared/src/services/googleBooksService.js
//
import { mapGoogleBook, mapOpenLibraryBook } from '../models/book';

const GOOGLE_BOOKS_BASE_URL = 'https://www.googleapis.com/books/v1/volumes';
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY; 

export const GoogleBooksService = {

    async getBookByIsbn(isbn) {
        try {
            let googleBook = null;

            // --- Fetch Google Data ---
            const strictUrl = `${GOOGLE_BOOKS_BASE_URL}?q=isbn:${isbn}&key=${API_KEY}`;
            const strictRes = await fetch(strictUrl);
            const strictData = await strictRes.json();

            if (strictData.items && strictData.items.length > 0) {
                googleBook = mapGoogleBook(strictData.items[0]);
            } else {
                // Fuzzy search if strict fails
                const fuzzyUrl = `${GOOGLE_BOOKS_BASE_URL}?q=${isbn}&maxResults=1&key=${API_KEY}`;
                const fuzzyRes = await fetch(fuzzyUrl);
                const fuzzyData = await fuzzyRes.json();
                if (fuzzyData.items && fuzzyData.items.length > 0) {
                    googleBook = mapGoogleBook(fuzzyData.items[0]);
                }
            }

            if (googleBook && googleBook.coverUrl && googleBook.pageCount > 0) {
                return googleBook;
            }

            // --- Fetch Open Library Data ---
            let openLibraryBook = null;
            const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
            const olResponse = await fetch(olUrl);
            const olData = await olResponse.json();
            
            const olKey = `ISBN:${isbn}`;
            if (olData[olKey]) {
                openLibraryBook = mapOpenLibraryBook(olData[olKey], isbn);
            }

            // --- Data Merge ---
            
            if (!googleBook && openLibraryBook) return openLibraryBook;
            
            if (googleBook && !openLibraryBook) return googleBook;
            
            if (googleBook && openLibraryBook) {
                return {
                    ...googleBook,
                    
                    coverUrl: googleBook.coverUrl || openLibraryBook.coverUrl,
                    
                    pageCount: googleBook.pageCount > 0 ? googleBook.pageCount : openLibraryBook.pageCount,
                    
                    description: googleBook.description || openLibraryBook.description
                };
            }

            // Total failure (neither found it)
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
