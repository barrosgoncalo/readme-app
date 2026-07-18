import { useEffect, useMemo, useState, useCallback } from 'react';
import { usePaginatedList } from './use-paginated-list';
import { algoliaPageAdapter } from './pagination-adapters';
import { browsePublications, clearSearchCache, SORT_OPTIONS } from '../services/searchBook';
import { doGetBlockedUids } from '../services/block';
import { DEFAULT_HITS_PER_PAGE } from '../constants/feedConstants';

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
    hitsPerPage?: number;
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
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
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

    // Shared logic for fetching page 1 and writing it into cache/state.
    // `setLoadingState` lets callers drive either the full-screen spinner
    // (isLoadingInitial) or the pull-to-refresh spinner (isRefreshing)
    // without duplicating the fetch/cache-write logic.
    const fetchFirstPage = useCallback(async (setLoadingState: (val: boolean) => void) => {
        setLoadingState(true);
        try {
            const response: any = await fetchPage(undefined);

            const fetchedItems = extractItems(response);

            feedCache.items = fetchedItems;
            feedCache.nextCursor = response?.nextCursor || null;
            feedCache.page = 1;
            feedCache.hasMore = response?.hasMore ?? fetchedItems.length > 0;

            setItems(feedCache.items);
            setHasMore(feedCache.hasMore);
        } catch (error) {
            console.error('Failed to fetch feed:', error);
        } finally {
            setLoadingState(false);
        }
    }, [fetchPage]);

    // 3. Load Initial
    const loadInitial = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh && feedCache.items.length > 0) {
            setItems(feedCache.items);
            setIsLoadingInitial(false);
            return;
        }
        await fetchFirstPage(setIsLoadingInitial);
    }, [fetchFirstPage]);

    // Pull-to-refresh: always force a fresh page 1, but drive the
    // RefreshControl's spinner (isRefreshing) instead of the
    // full-screen loader (isLoadingInitial). Clearing the Algolia
    // client cache first is essential here — the refresh query is
    // identical to the one already loaded, so without this the
    // client would just hand back the cached response and nothing
    // would visibly change.
    const refresh = useCallback(async () => {
        await clearSearchCache();
        await fetchFirstPage(setIsRefreshing);
    }, [fetchFirstPage]);

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

    // 5. Update a single item in place (e.g. after toggling favorite),
    // without re-fetching or disturbing scroll position.
    const updateItem = useCallback((id: string, updates: Partial<FeedItem> | ((item: FeedItem) => Partial<FeedItem>)) => {
        feedCache.items = feedCache.items.map((item) => {
            if (item.id !== id) return item;
            const patch = typeof updates === 'function' ? updates(item) : updates;
            return { ...item, ...patch };
        });
        setItems(feedCache.items);
    }, []);

    useEffect(() => {
        if (blockedLoaded) {
            loadInitial();
        }
    }, [blockedLoaded, loadInitial]);

    return {
        items,
        isLoadingInitial,
        isLoadingMore,
        isRefreshing,
        hasMore,
        loadMore,
        loadInitial,
        refresh,
        updateItem,
        refetch: () => loadInitial(true)
    };
}