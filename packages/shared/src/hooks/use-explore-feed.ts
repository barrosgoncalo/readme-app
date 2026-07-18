import { useEffect, useMemo, useState, useCallback } from 'react';
import { usePaginatedList } from './use-paginated-list';
import { algoliaPageAdapter } from './pagination-adapters';
import { browsePublications, SORT_OPTIONS } from '../services/searchBook';
import { doGetBlockedUids } from '../services/block';
import { DEFAULT_HITS_PER_PAGE } from "../constants/feedConstants";

// Define the shape of our items (assuming they have at least an 'id')
export interface FeedItem {
    id: string;
    [key: string]: any;
}

// Define the shape of our module-level cache
interface ExploreFeedCache {
    filterKey: string;
    items: FeedItem[];
    nextCursor: any | null;
    hasMore: boolean;
    page: number;
}

interface UseExploreFeedProps {
    excludeUid?: string | null;
    sortBy?: string;
    conditions?: string[];
    genres?: string[];
    includeAllStatuses?: boolean;
}

// ==========================================
// MODULE-LEVEL CACHE
// Survives component unmounting so the Back button restores instantly
// ==========================================
let feedCache: ExploreFeedCache = {
    filterKey: '',
    items: [],
    nextCursor: null,
    hasMore: true,
    page: 0,
};

export function useExploreFeed({
    excludeUid = null,
    sortBy = SORT_OPTIONS.DATE_DESC,
    conditions = [],
    genres = [],
    includeAllStatuses = false,
    hitsPerPage = DEFAULT_HITS_PER_PAGE,
}: UseExploreFeedProps = {}) {
    // Generate a unique string for the current active filters
    const currentFilterKey = JSON.stringify({ excludeUid, sortBy, conditions, genres, includeAllStatuses });

    // If filters change (e.g. changing SORT or Genres), bust the cache synchronously
    if (feedCache.filterKey !== currentFilterKey) {
        feedCache = {
            filterKey: currentFilterKey,
            items: [],
            nextCursor: null,
            hasMore: true,
            page: 0,
        };
    }

    const [blockedUids, setBlockedUids] = useState<string[]>([]);
    const [blockedLoaded, setBlockedLoaded] = useState<boolean>(!excludeUid);

    const [items, setItems] = useState<FeedItem[]>(feedCache.items);
    const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(feedCache.items.length === 0);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(feedCache.hasMore);

    // 1. Fetch Blocked UIDs
    useEffect(() => {
        let cancelled = false;
        if (!excludeUid) {
            setBlockedUids([]);
            setBlockedLoaded(true);
            return;
        }
        setBlockedLoaded(false);
        doGetBlockedUids(excludeUid)
            .then((ids: string[]) => { if (!cancelled) setBlockedUids(ids); })
            .catch((e: Error) => console.error('Failed to load blocked users:', e))
            .finally(() => { if (!cancelled) setBlockedLoaded(true); });
        return () => { cancelled = true; };
    }, [excludeUid]);

    // 2. Setup the Algolia fetcher
    const fetchPage = useMemo(
        () => algoliaPageAdapter((params: any) =>
            browsePublications({ ...params, hitsPerPage, sortBy, conditions, genres, excludeUid, blockedUids, includeAllStatuses })
        ),
        [sortBy, conditions, genres, excludeUid, blockedUids, hitsPerPage, includeAllStatuses]
    );

    // Helper to safely extract items
    const extractItems = (res: any): FeedItem[] => Array.isArray(res) ? res : res?.items || res?.hits || [];

    // 3. Load Initial
    const loadInitial = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh && feedCache.items.length > 0) {
            setItems(feedCache.items);
            setIsLoadingInitial(false);
            return;
        }

        setIsLoadingInitial(true);
        try {
            // Pass undefined to fetch the first page
            const response: any = await fetchPage(undefined);

            const fetchedItems = extractItems(response);

            feedCache.items = fetchedItems;
            feedCache.nextCursor = response?.nextCursor || null;
            feedCache.page = 1;
            feedCache.hasMore = response?.hasMore ?? fetchedItems.length > 0;

            setItems(feedCache.items);
            setHasMore(feedCache.hasMore);
        } catch (error) {
            console.error('Failed to fetch initial feed:', error);
        } finally {
            setIsLoadingInitial(false);
        }
    }, [fetchPage]);

    // 4. Load More Pages
    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        try {
            const params = feedCache.nextCursor || { page: feedCache.page };
            const response: any = await fetchPage(params);

            const newItems = extractItems(response);

            const existingIds = new Set(feedCache.items.map((i: FeedItem) => i.id));
            const uniqueNewItems = newItems.filter((i: FeedItem) => !existingIds.has(i.id));

            feedCache.items = [...feedCache.items, ...uniqueNewItems];
            feedCache.nextCursor = response?.nextCursor || null;
            feedCache.page += 1;
            feedCache.hasMore = response?.hasMore ?? newItems.length > 0;

            setItems(feedCache.items);
            setHasMore(feedCache.hasMore);
        } catch (error) {
            console.error('Failed to load more feed data:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [fetchPage, hasMore, isLoadingMore]);

    useEffect(() => {
        if (blockedLoaded) {
            loadInitial();
        }
    }, [blockedLoaded, loadInitial]);

    return {
        items,
        isLoadingInitial,
        isLoadingMore,
        hasMore,
        loadMore,
        loadInitial,
        refetch: () => loadInitial(true)
    };
}
