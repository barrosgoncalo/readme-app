import { useEffect, useMemo, useRef, useCallback } from 'react';
import { usePaginatedList } from './use-paginated-list';
import { UsersService } from '../services/users';
import { PublicationService } from '../services/publications';

const FAVORITES_PAGE_SIZE = 15;

/**
 * Infinite-scroll feed for the Favorites screen.
 *
 * `UsersService.fetchUserFavorites` returns the *entire* array of
 * favorite bookIds in one call (there's no Firestore cursor to page
 * through), so pagination here is just an offset into that id array —
 * chunks of FAVORITES_PAGE_SIZE ids are hydrated into full publication
 * objects via `PublicationService.fetchPublicationsByIds` per "page".
 *
 * The id list itself is re-fetched fresh any time cursor is null (i.e.
 * on loadInitial/refresh), so pull-to-refresh picks up favorites
 * added/removed elsewhere in the app.
 */
export function useFavoritesFeed(currentUserId) {
    const idsRef = useRef([]);

    const fetchPage = useMemo(() => {
        return async (cursor) => {
            let allIds = idsRef.current;

            if (cursor === null) {
                const fetchedIds = await UsersService.fetchUserFavorites(currentUserId);
                allIds = fetchedIds || []; 
                idsRef.current = allIds;
            }

            const offset = cursor ?? 0;
            const pageIds = allIds.slice(offset, offset + FAVORITES_PAGE_SIZE);

            let items = [];
            if (pageIds.length) {
                const fetched = await PublicationService.fetchPublicationsByIds(pageIds);
                // fetchPublicationsByIds may not preserve input order
                // (e.g. Firestore `in` queries don't), so reorder to
                // match pageIds and keep pagination order stable.
                const byId = new Map(fetched.map((book) => [book.id, book]));
                items = pageIds
                    .map((id) => byId.get(id))
                    .filter(Boolean)
                    .map((book) => ({ ...book, isFavorite: true }));
            }

            const nextOffset = offset + FAVORITES_PAGE_SIZE;
            return {
                items,
                nextCursor: nextOffset,
                hasMore: nextOffset < allIds.length,
            };
        };
    }, [currentUserId]);

    const getId = useCallback((item: { id: string }) => item.id, []);

    const feed = usePaginatedList({
        fetchPage,
        getId,
    });

    useEffect(() => {
        if (currentUserId) feed.loadInitial();
    }, [currentUserId]);

    return feed;
}
