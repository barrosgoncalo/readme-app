import { useEffect, useMemo, useState, useCallback } from 'react';
import { usePaginatedList } from './use-paginated-list';
import { algoliaPageAdapter } from './pagination-adapters';
import { browsePublications, SORT_OPTIONS } from '../services/searchBook';
import { doGetBlockedUids } from '../services/block';

export function useExploreFeed({
    excludeUid = null,
    sortBy = SORT_OPTIONS.DATE_DESC,
    conditions = [],
    genres = [],
    includeAllStatuses = false
} = {}) {
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
            browsePublications({ ...params, sortBy, conditions, genres, excludeUid, blockedUids, includeAllStatuses })
        ),
        [sortBy, conditions, genres, excludeUid, blockedUids]
    );

    const feed = usePaginatedList({
        fetchPage,
        getId: (item) => item.id,
    });

    useEffect(() => {
        // Wait for blocked-uid list before the first fetch, so blocked
        // users' publications never flash on screen momentarily.
        if (blockedLoaded) feed.loadInitial();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortBy, JSON.stringify(conditions), JSON.stringify(genres), excludeUid, blockedLoaded]);

    return feed;
}
