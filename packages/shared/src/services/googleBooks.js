// @readme/shared/src/services/googleBooksService.js
import { mapGoogleBook, mapOpenLibraryBook } from '../models/book';

const GOOGLE_BOOKS_BASE_URL = 'https://www.googleapis.com/books/v1/volumes';
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY; 

export const GoogleBooksService = {
    
    async getBookByIsbn(isbn) {
        try {
            let googleBook = null;

            // --- ATTEMPT 1 & 2: Fetch Google Data ---
            const strictUrl = `${GOOGLE_BOOKS_BASE_URL}?q=isbn:${isbn}&key=${API_KEY}`;
            const strictRes = await fetch(strictUrl);
            const strictData = await strictRes.json();

            if (strictData.items && strictData.items.length > 0) {
                googleBook = mapGoogleBook(strictData.items[0]);
            } else {
                const fuzzyUrl = `${GOOGLE_BOOKS_BASE_URL}?q=${isbn}&maxResults=1&key=${API_KEY}`;
                const fuzzyRes = await fetch(fuzzyUrl);
                const fuzzyData = await fuzzyRes.json();
                if (fuzzyData.items && fuzzyData.items.length > 0) {
                    googleBook = mapGoogleBook(fuzzyData.items[0]);
                }
            }

            // Return instantly if perfect
            if (googleBook && googleBook.coverUrl && googleBook.pageCount > 0) {
                return googleBook;
            }

            // --- ATTEMPT 3: Open Library Fallback ---
            let openLibraryBook = null;
            const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
            const olResponse = await fetch(olUrl);
            const olData = await olResponse.json();
            
            const olKey = `ISBN:${isbn}`;
            if (olData[olKey]) {
                openLibraryBook = mapOpenLibraryBook(olData[olKey], isbn);
            }

            // --- THE MERGE ---
            let finalBook = null;
            
            if (!googleBook && openLibraryBook) finalBook = openLibraryBook;
            else if (googleBook && !openLibraryBook) finalBook = googleBook;
            else if (googleBook && openLibraryBook) {
                finalBook = {
                    ...googleBook,
                    coverUrl: googleBook.coverUrl || openLibraryBook.coverUrl,
                    pageCount: googleBook.pageCount > 0 ? googleBook.pageCount : openLibraryBook.pageCount,
                    description: googleBook.description || openLibraryBook.description
                };
            }

            // --- ATTEMPT 4: THE EDITION STEALER ---
            // If we found the book, but we are STILL missing the cover or pages...
            if (finalBook && finalBook.title && (!finalBook.coverUrl || finalBook.pageCount === 0)) {
                try {
                    // Clean the title (remove subtitles after a colon to cast a wider net)
                    const cleanTitle = finalBook.title.split(':')[0];
                    const titleUrl = `${GOOGLE_BOOKS_BASE_URL}?q=intitle:${encodeURIComponent(cleanTitle)}&maxResults=5&key=${API_KEY}`;
                    const titleRes = await fetch(titleUrl);
                    const titleData = await titleRes.json();

                    if (titleData.items) {
                        // Find the first edition of this book that HAS a cover and pages
                        const betterEdition = titleData.items.find(item => 
                            item.volumeInfo?.imageLinks?.thumbnail && 
                            item.volumeInfo?.pageCount > 0
                        );

                        if (betterEdition) {
                            const stolenData = mapGoogleBook(betterEdition);
                            // Steal the missing pieces
                            finalBook.coverUrl = finalBook.coverUrl || stolenData.coverUrl;
                            finalBook.pageCount = finalBook.pageCount > 0 ? finalBook.pageCount : stolenData.pageCount;
                            finalBook.description = finalBook.description || stolenData.description;
                        }
                    }
                } catch (e) {
                    console.error("Edition Stealer failed, proceeding with partial data.", e);
                }
            }

            return finalBook; 

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

            // Use the Google Adapter for text searches
            return data.items.map(item => mapGoogleBook(item));

        } catch (error) {
            console.error("Error searching books:", error);
            throw error;
        }
    }
};
