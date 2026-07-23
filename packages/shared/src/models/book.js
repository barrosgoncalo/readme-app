import { serverTimestamp } from 'firebase/firestore';

/**
 * ADAPTER 1: Maps Google Books JSON into our standard app model
 */
export const mapGoogleBook = (apiData) => {
    const info = apiData.volumeInfo || {};
    const pages = info.pageCount || info.printedPageCount || 0;
    
    console.log(`[PAGE TRACKER 1 - Adapter] Found ${pages} pages for "${info.title || 'Unknown'}"`);

    const isbn13Obj = info.industryIdentifiers?.find(id => id.type === 'ISBN_13');
    const isbn10Obj = info.industryIdentifiers?.find(id => id.type === 'ISBN_10');

    let coverUrl = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null;
    if (coverUrl) coverUrl = coverUrl.replace('http:', 'https:').replace('&zoom=1', '&zoom=3');

    const fallbackIsbn = isbn13Obj ? isbn13Obj.identifier : (isbn10Obj ? isbn10Obj.identifier : null);
    if (!coverUrl && fallbackIsbn) coverUrl = `https://covers.openlibrary.org/b/isbn/${fallbackIsbn}-L.jpg`;

    return {
        bookId: apiData.id || `google_${Date.now()}`,
        title: info.title || 'Unknown Title',
        authors: info.authors || [],
        isbn13: isbn13Obj ? isbn13Obj.identifier : null,
        isbn10: isbn10Obj ? isbn10Obj.identifier : null,
        coverUrl: coverUrl,
        pageCount: pages, // 🔥 explicitly mapped
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
export const createUserBookModel = (userId, bookId, status = 'reading', overrides = {}) => {
    const now = new Date().toISOString();

    return {
        userId: userId,
        bookId: bookId,
        createdAt: serverTimestamp(),
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

/**
 * UNIVERSAL NORMALIZER: Ensures Web and Mobile always send the exact same object shape.
 * Pass this any item from your search hooks.
 */
export const normalizeAnyBook = (item) => {
    if (!item) return {};

    if (item.volumeInfo) {
        return mapGoogleBook(item);
    }

    // OpenLibrary doc keys start with "/works/..." -> Clean it to "works_..." or strip the slash
    const rawId = item.bookId || item.id || item.key || `ol_${Date.now()}`;
    const cleanBookId = String(rawId).replace(/^\//, '').replace(/\//g, '_');

    const pages = item.pageCount || item.number_of_pages || item.number_of_pages_median || 0;

    return {
        ...item,
        bookId: cleanBookId, 
        title: item.title || 'Untitled',
        authors: item.authors || item.author_name || [],
        coverUrl: item.coverUrl || item.thumbnail || null,
        pageCount: pages,
        isbn13: item.isbn13 || item.isbn?.[0] || null,
    };
};
