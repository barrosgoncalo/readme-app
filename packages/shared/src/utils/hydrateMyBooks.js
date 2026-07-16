import { getBook, getBookByIsbn, getBooksByIds } from '../services/booksCatalog';
import { mapGoogleBook } from '../models/book';

/**
 * Hydrates raw myBooks subcollection docs into display-ready book objects.
 *
 * Pipeline:
 *   1. Batch-fetch catalog metadata for all IDs.
 *   2. Individual getDoc fallback for any still missing.
 *   3. ISBN repair: for legacy books with ISBN-shaped IDs and no title,
 *      try the global cache then Google Books API.
 *
 * @param {object[]} myBookDocs  Flattened Shelf docs (see callers' flattenShelfDoc helpers)
 * @param {object}  [options]
 * @param {string}  [options.apiKey]    Google Books API key (skips API step if absent)
 * @param {function} [options.onRepair] Called after each ISBN repair with (bookId, {title,authors,coverUrl,description}).
 *                                      Errors from this callback are swallowed — use it for best-effort backfills.
 * @returns {Promise<object[]>}
 */
export async function hydrateMyBooks(myBookDocs, { apiKey, onRepair } = {}) {
    const myIds = myBookDocs.map(d => d.id);
    const myBooksMap = Object.fromEntries(myBookDocs.map(m => [m.id, m]));

    const catalogMap = {};
    try {
        const catalogDocs = await getBooksByIds(myIds);
        catalogDocs.forEach(c => { catalogMap[c.id] = c; });
    } catch {
        // batch failed; individual fallback below
    }

    const missingIds = myIds.filter(id => !catalogMap[id]);
    if (missingIds.length > 0) {
        const settled = await Promise.allSettled(missingIds.map(id => getBook(id)));
        settled.forEach((res, i) => {
            if (res.status === 'fulfilled' && res.value) {
                catalogMap[missingIds[i]] = res.value;
            }
        });
    }

    const hydrated = myIds.map(id => {
        const my = myBooksMap[id];
        const cat = catalogMap[id];
        return {
            id,
            bookId: id,
            title: cat?.title || my?.title || null,
            authors: cat?.authors || my?.authors || [],
            coverUrl: cat?.coverUrl || my?.coverUrl || null,
            description: cat?.description || null,
            status: my?.status || 'reading',
            progress: my?.progress ?? 0,
            addedAt: my?.addedAt || null,
            rating: my?.rating ?? null,
            notes: my?.notes || null,
            availableForTrade: my?.availableForTrade ?? false,
        };
    });

    const needsRepair = hydrated.filter(b => !b.title && /^\d{10,13}$/.test(b.id));
    if (needsRepair.length > 0) {
        await Promise.allSettled(needsRepair.map(async b => {
            try {
                let title, authors, coverUrl, description;

                const cached = await getBookByIsbn(b.id);
                if (cached?.title) {
                    title = cached.title;
                    authors = cached.authors || [];
                    coverUrl = cached.coverUrl || null;
                    description = cached.description || null;
                } else if (apiKey) {
                    const res = await fetch(
                        `https://www.googleapis.com/books/v1/volumes?q=isbn:${b.id}&maxResults=1&key=${apiKey}`
                    );
                    const json = await res.json();
                    const item = json.items?.[0];
                    if (!item) return;
                    const mapped = mapGoogleBook(item);
                    if (!mapped.title || mapped.title === 'Unknown Title') return;
                    ({ title, authors, coverUrl, description } = mapped);
                } else {
                    return;
                }

                const idx = hydrated.findIndex(h => h.id === b.id);
                if (idx !== -1) {
                    hydrated[idx] = { ...hydrated[idx], title, authors, coverUrl, description };
                }
                if (onRepair) await onRepair(b.id, { title, authors, coverUrl, description }).catch(() => {});
            } catch { /* keep placeholder on error */ }
        }));
    }

    return hydrated;
}
