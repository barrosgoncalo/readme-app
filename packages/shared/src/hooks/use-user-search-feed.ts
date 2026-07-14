import { useEffect, useMemo, useState } from 'react';
import { usePaginatedList } from './use-paginated-list';
import { algoliaPageAdapter } from './pagination-adapters';
import { searchUsers } from '../services/searchUser';
import { doGetBlockedUids } from '../services/block';

/**
 * Infinite-scroll feed for the People tab of the Search screen.
 * Mirrors useExploreFeed's approach to blocked users: fetch the blocked-id
 * list once per currentUserId (reusing the same service Explore uses, so
 * both blocklists always stay in sync), then apply it as an Algolia
 * filter rather than filtering hits after the fact — this way pagination
 * math (nbPages/hasMore) stays accurate.
 */
export function useUserSearchFeed({ searchText, currentUserId }) {
    const [blockedUids, setBlockedUids] = useState([]);
    const [blockedLoaded, setBlockedLoaded] = useState(!currentUserId);

    useEffect(() => {
        let cancelled = false;
        if (!currentUserId) {
            setBlockedUids([]);
            setBlockedLoaded(true);
            return;
        }
        setBlockedLoaded(false);
        doGetBlockedUids(currentUserId)
            .then((ids) => { if (!cancelled) setBlockedUids(ids); })
            .catch((e) => console.error('Failed to load blocked users:', e))
            .finally(() => { if (!cancelled) setBlockedLoaded(true); });
        return () => { cancelled = true; };
    }, [currentUserId]);

    const trimmed = (searchText || '').trim();

    const fetchPage = useMemo(
        () => algoliaPageAdapter(
            (params) => searchUsers(trimmed, { ...params, excludeUid: currentUserId, blockedUids }),
            'users'
        ),
        [trimmed, currentUserId, blockedUids]
    );

    const feed = usePaginatedList({
        fetchPage,
        getId: (item) => item.uid,
    });

    useEffect(() => {
        // Wait for the blocklist before the first fetch, same reasoning
        // as useExploreFeed — avoids a flash of blocked users on screen.
        if (trimmed && blockedLoaded) feed.loadInitial();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trimmed, currentUserId, blockedLoaded]);

    return feed;
}