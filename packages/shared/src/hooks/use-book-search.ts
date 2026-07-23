import { useState, useEffect } from 'react';

export function useBookSearch() {
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
            try {
                // 1. Try Google Books first
                const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || ''; 
                const query = encodeURIComponent(searchQuery.trim());
                const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${apiKey}`;
                
                const response = await fetch(googleUrl);
                
                if (!response.ok) {
                    // If Google gives a 503, throw an error to trigger the fallback
                    throw new Error(`Google Error: ${response.status}`);
                }
                
                const data = await response.json();
                setSearchResults(data.items || []);
                
            } catch (err) {
                console.warn("Google Books failed, falling back to OpenLibrary...", err);
                
                // 2. Fallback to OpenLibrary API
                try {
                    const olQuery = encodeURIComponent(searchQuery.trim());
                    const olUrl = `https://openlibrary.org/search.json?q=${olQuery}&limit=10`;
                    
                    const olResponse = await fetch(olUrl);
                    if (!olResponse.ok) throw new Error("OpenLibrary also failed.");
                    
                    const olData = await olResponse.json();
                    
                    // 3. Map OpenLibrary's weird data shape into the shape your app expects
                    const fallbackBooks = (olData.docs || []).map((doc: any) => ({
                        id: doc.key,
                        title: doc.title,
                        authors: doc.author_name || [],
                        isbn: doc.isbn ? doc.isbn[0] : null,
                        publishedYear: doc.first_publish_year ? String(doc.first_publish_year) : null,
                        coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null
                    }));

                    setSearchResults(fallbackBooks);
                    setError(null); // Clear the error since the fallback succeeded!
                    
                } catch (fallbackErr: any) {
                    console.error("Both APIs failed:", fallbackErr);
                    setError("Could not reach book servers. Please try again later.");
                    setSearchResults([]);
                }
            } finally {
                setIsLoading(false);
            }
        }, 600); // 600ms debounce

        return () => clearTimeout(delayDebounceFn);
        
    }, [searchQuery]);

    return {
        searchQuery,
        setSearchQuery,
        searchResults,
        isLoading,
        error
    };
}
