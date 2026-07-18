import { useEffect, useMemo, useState } from 'react';
import { usePaginatedList } from './use-paginated-list';
import { algoliaPageAdapter } from './pagination-adapters';
import { searchPublicationsByBook, SORT_OPTIONS } from '../services/searchBook';
import { doGetBlockedUids } from '../services/block';

/**
 * Infinite-scroll feed for the publication results grid on the Search
 * screen (shown once a book suggestion is selected / search submitted).
 * Reuses the same Algolia page adapter as the Explore feed.
 */
export function usePublicationSearchFeed({
                                             book, // { bookId, title, author } | null
                                             sortBy = SORT_OPTIONS.RELEVANCE,
                                             conditions = [],
                                             genres = [],
                                             excludeUid = null,
                                         }) {
    const [blockedUids, setBlockedUids] = useState([]);
    const [blockedLoaded, setBlockedLoaded] = useState(!excludeUid);

    useEffect(() => {
        let cancelled = false;
        if (!excludeUid) {
            setBlockedUids([]);
            setBlockedLoaded(true);
            return;
        }
        setBlockedLoaded(false);
        doGetBlockedUids(excludeUid)
            .then((ids) => { if (!cancelled) setBlockedUids(ids); })
            .catch((e) => console.error('Failed to load blocked users:', e))
            .finally(() => { if (!cancelled) setBlockedLoaded(true); });
        return () => { cancelled = true; };
    }, [excludeUid]);

    const fetchPage = useMemo(
        () => algoliaPageAdapter((params) =>
            searchPublicationsByBook(book, { ...params, sortBy, conditions, genres, excludeUid, blockedUids })
        ),
        [book, sortBy, conditions, genres, excludeUid, blockedUids]
    );

    const feed = usePaginatedList({
        fetchPage,
        getId: (item) => item.id,
    });

    useEffect(() => {
        // Wait for blocked-uid list before the first fetch, so blocked
        // users' publications never flash on screen momentarily —
        // same reasoning as useExploreFeed.
        if (book && blockedLoaded) feed.loadInitial();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [book, sortBy, JSON.stringify(conditions), JSON.stringify(genres), excludeUid, blockedLoaded]);

    return feed;
}