import { useState, useEffect } from 'react';

export function useBookSearch(apiKey: string = '') {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setError(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        const delayDebounceFn = setTimeout(async () => {
            // Inside your use-book-search.ts fetch function:

            try {
                console.log(`[API] 🔍 Attempting to fetch from Google Books for query: "${searchQuery}"...`);

                // 1. Try Google Books first
                const query = encodeURIComponent(searchQuery.trim());
                const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${apiKey}`;

                const response = await fetch(googleUrl);

                if (!response.ok) {
                    throw new Error(`Google Error: ${response.status}`);
                }

                const data = await response.json();

                // Add success log here!
                console.log(`[API] ✅ SUCCESS: Loaded ${data.items?.length || 0} books from Google Books!`);

                setSearchResults(data.items || []);
                setError(null);

            } catch (err: any) {
                console.warn(`[API] ⚠️ Google Books failed (${err.message}). Triggering OpenLibrary fallback...`);

                // 2. Fallback to OpenLibrary API
                try {
                    const olQuery = encodeURIComponent(searchQuery.trim());
                    const olUrl = `https://openlibrary.org/search.json?q=${olQuery}&limit=10`;

                    const olResponse = await fetch(olUrl);
                    if (!olResponse.ok) throw new Error("OpenLibrary also failed.");

                    const olData = await olResponse.json();

                    const fallbackBooks = (olData.docs || []).map((doc: any) => ({
                        id: doc.key,
                        title: doc.title,
                        authors: doc.author_name || [],
                        isbn: doc.isbn ? doc.isbn[0] : null,
                        publishedYear: doc.first_publish_year ? String(doc.first_publish_year) : null,
                        coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
                        pageCount: doc.number_of_pages_median || null
                    }));

                    // Add fallback success log here!
                    console.log(`[API] 🛟 FALLBACK SUCCESS: Loaded ${fallbackBooks.length} books from OpenLibrary!`);

                    setSearchResults(fallbackBooks);
                    setError(null); 

                } catch (fallbackErr: any) {
                    console.error("[API] ❌ FATAL: Both Google Books and OpenLibrary failed.");
                    setError("Could not reach book servers. Please try again later.");
                    setSearchResults([]);
                }
            } finally {
                setIsLoading(false);
            }
        }, 600);

        return () => clearTimeout(delayDebounceFn);

    }, [searchQuery, apiKey]);

    return { searchQuery, setSearchQuery, searchResults, isLoading, error };
}
