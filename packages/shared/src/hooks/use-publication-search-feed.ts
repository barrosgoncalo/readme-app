import { useEffect, useMemo } from 'react';
import { usePaginatedList } from './use-paginated-list';
import { algoliaPageAdapter } from './pagination-adapters';
import { searchPublicationsByBook, SORT_OPTIONS } from '../services/searchBook';

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
    const fetchPage = useMemo(
        () => algoliaPageAdapter((params) =>
            searchPublicationsByBook(book, { ...params, sortBy, conditions, genres, excludeUid })
        ),
        [book, sortBy, conditions, genres, excludeUid]
    );

    const feed = usePaginatedList({
        fetchPage,
        getId: (item) => item.id,
    });

    useEffect(() => {
        if (book) feed.loadInitial();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [book, sortBy, JSON.stringify(conditions), JSON.stringify(genres), excludeUid]);

    return feed;
}