// @readme/shared/src/models/book.js

/**
 * ADAPTER 1: Maps Google Books JSON into our standard app model
 */
export const mapGoogleBook = (apiData) => {
    const info = apiData.volumeInfo || {};
    
    const isbn13Obj = info.industryIdentifiers?.find(id => id.type === 'ISBN_13');
    const isbn10Obj = info.industryIdentifiers?.find(id => id.type === 'ISBN_10');

    let coverUrl = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null;
    
    if (coverUrl) {
        coverUrl = coverUrl.replace('http:', 'https:').replace('&zoom=1', '&zoom=3');
    }

    const fallbackIsbn = isbn13Obj ? isbn13Obj.identifier : (isbn10Obj ? isbn10Obj.identifier : null);
    if (!coverUrl && fallbackIsbn) {
        coverUrl = `https://covers.openlibrary.org/b/isbn/${fallbackIsbn}-L.jpg`;
    }

    return {
        bookId: apiData.id || `google_${Date.now()}`,
        title: info.title || 'Unknown Title',
        authors: info.authors || [],
        isbn13: isbn13Obj ? isbn13Obj.identifier : null,
        isbn10: isbn10Obj ? isbn10Obj.identifier : null,
        coverUrl: coverUrl,
        pageCount: info.pageCount || 0,
        description: info.description || null,
        categories: info.categories || [],
        publishedDate: info.publishedDate || null,
    };
};

/**
 * ADAPTER 2: Maps Open Library JSON into our standard app model
 */
export const mapOpenLibraryBook = (apiData, searchedIsbn) => {
    return {
        bookId: `ol_${Date.now()}`,
        title: apiData.title || 'Unknown Title',
        // Open Library authors are an array of objects: { name: "Author Name" }
        authors: apiData.authors ? apiData.authors.map(a => a.name) : [],
        isbn13: searchedIsbn?.length === 13 ? searchedIsbn : null,
        isbn10: searchedIsbn?.length === 10 ? searchedIsbn : null,
        coverUrl: apiData.cover?.large || apiData.cover?.medium || null,
        pageCount: apiData.number_of_pages || 0,
        description: apiData.notes || null, 
        categories: apiData.subjects ? apiData.subjects.map(s => s.name).slice(0, 5) : [],
        publishedDate: apiData.publish_date || null,
    };
};

/**
 * ADAPTER 3: Maps ISBNdb JSON into our standard app model
 */
export const mapIsbnDbBook = (apiData) => {
    // ISBNdb puts everything inside a "book" object
    const info = apiData.book || {};
    
    return {
        bookId: info.isbn13 || info.isbn || `isbndb_${Date.now()}`,
        title: info.title || 'Unknown Title',
        authors: info.authors || [], // Usually already an array of strings
        isbn13: info.isbn13 || null,
        isbn10: info.isbn || null,
        
        // ISBNdb is known for having very reliable, high-res image URLs
        coverUrl: info.image || null,
        
        pageCount: info.pages || 0,
        description: info.synopsis || info.overview || null,
        categories: info.subjects || [],
        
        publishedDate: info.publish_date || null,
    };
};

/**
 * DATABASE MODEL: Wraps the standardized API data with user-specific shelf data
 */
export const createUserBookModel = (userId, bookId, status = 'want_to_read', overrides = {}) => {
    const now = new Date().toISOString();

    return {
        userId: userId,
        bookId: bookId,
        status: status,
        currentPage: overrides.currentPage || 0,
        progressPercentage: overrides.progressPercentage || 0,
        addedAt: now,
        startedAt: status === 'reading' ? now : null,
        finishedAt: status === 'finished' ? now : null,
        color: overrides.color || '#E58F24',
        rating: overrides.rating || null,
        notes: overrides.notes || null
    };
};
