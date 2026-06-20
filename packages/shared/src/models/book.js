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
 * DATABASE MODEL: Wraps the standardized API data with user-specific shelf data
 */
export const createUserBookModel = (userId, bookData, status = 'want_to_read') => {
    const now = new Date().toISOString();

    return {
        userId: userId,
        bookId: bookData.bookId,
        title: bookData.title,
        authors: bookData.authors,
        coverUrl: bookData.coverUrl,
        pageCount: bookData.pageCount,
        status: status,
        currentPage: 0,
        progressPercentage: 0,
        addedAt: now,
        startedAt: status === 'reading' ? now : null,
        finishedAt: status === 'finished' ? now : null,
        color: '#E58F24',
        rating: null,
        notes: null
    };
};
