import { useEffect, useMemo, useState, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { algoliaPageAdapter } from './pagination-adapters';
import { browsePublications, clearSearchCache, SORT_OPTIONS } from '../services/searchBook';
import { doGetBlockedUids } from '../services/block';
import { DEFAULT_HITS_PER_PAGE } from '../constants/feedConstants';

export interface FeedItem {
    id: string;
    [key: string]: any;
}

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
    forceRefreshOnMount?: boolean;
}

// MODULE-LEVEL CACHE
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
    forceRefreshOnMount = false,
}: UseExploreFeedProps = {}) {
    const currentFilterKey = JSON.stringify({ excludeUid, sortBy, conditions, genres, includeAllStatuses });

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
    const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(
        feedCache.items.length === 0 || forceRefreshOnMount
    );
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(feedCache.hasMore);

    // --- REUSABLE BLOCK FETCHER ---
    const loadBlockedUids = useCallback(async () => {
        if (!excludeUid) return [];
        try {
            return await doGetBlockedUids(excludeUid);
        } catch (e) {
            console.error('Failed to load blocked users:', e);
            return [];
        }
    }, [excludeUid]);

    // 1. Fetch Blocked UIDs Initial Mount
    useEffect(() => {
        let cancelled = false;
        if (!excludeUid) {
            setBlockedUids([]);
            setBlockedLoaded(true);
            return;
        }
        setBlockedLoaded(false);
        loadBlockedUids().then((ids) => {
            if (!cancelled) {
                setBlockedUids(ids);
                setBlockedLoaded(true);
            }
        });
        return () => { cancelled = true; };
    }, [excludeUid, loadBlockedUids]);

    // 2. Setup the Algolia fetcher (used primarily for loadMore)
    const fetchPage = useMemo(
        () => algoliaPageAdapter((params: any) =>
            browsePublications({ ...params, hitsPerPage, sortBy, conditions, genres, excludeUid, blockedUids, includeAllStatuses })
        ),
        [sortBy, conditions, genres, excludeUid, blockedUids, hitsPerPage, includeAllStatuses]
    );

    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('USER_BLOCKED', (blockedUserId: string) => {
            console.log('🚨 EVENTO RECEBIDO: Utilizador bloqueado ->', blockedUserId);

            // 1. Atualizar o state local de bloqueados
            setBlockedUids((prev) => {
                if (prev.includes(blockedUserId)) return prev;
                return [...prev, blockedUserId];
            });

            // 2. Filtrar a cache. Vê se a propriedade é ownerId, userId ou uid!
            const cacheAnterior = feedCache.items.length;

            feedCache.items = feedCache.items.filter((item: any) => {
                // ATENÇÃO: Confirma se o teu backend usa userId, ownerId, etc.
                const itemOwnerId = item.ownerId || item.userId || item.uid || item.authorId || item.seller?.id;

                return itemOwnerId !== blockedUserId;
            });

            console.log(`🧹 Livros removidos: ${cacheAnterior - feedCache.items.length}`);

            // 3. Forçar o re-render do ecrã com a cache limpa
            setItems([...feedCache.items]);
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const extractItems = (res: any): FeedItem[] => Array.isArray(res) ? res : res?.items || res?.hits || [];

    // Helper to fetch page 1 - allows passing specific blockedUids to bypass stale state closures
    const fetchFirstPage = useCallback(async (
        setLoadingState: (val: boolean) => void,
        currentBlockedUids: string[] = blockedUids
    ) => {
        setLoadingState(true);
        try {
            const response: any = await algoliaPageAdapter((params: any) =>
                browsePublications({ ...params, hitsPerPage, sortBy, conditions, genres, excludeUid, blockedUids: currentBlockedUids, includeAllStatuses })
            )(undefined);

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
    }, [sortBy, conditions, genres, excludeUid, blockedUids, hitsPerPage, includeAllStatuses]);

    // 3. Load Initial
    const loadInitial = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh && feedCache.items.length > 0) {
            setItems(feedCache.items);
            setIsLoadingInitial(false);
            return;
        }
        await fetchFirstPage(setIsLoadingInitial, blockedUids);
    }, [fetchFirstPage, blockedUids]);

    // 4. Pull-to-refresh: Update blocks FIRST
    const refresh = useCallback(async () => {
        setIsRefreshing(true); // Manually set to prevent flicker while blocks fetch
        const freshBlocks = await loadBlockedUids();
        setBlockedUids(freshBlocks);
        
        await clearSearchCache();
        await fetchFirstPage(setIsRefreshing, freshBlocks);
    }, [fetchFirstPage, loadBlockedUids]);

    // 5. Load More Pages
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

    // 6. Background sync for blocks (called when returning to screen)
    const syncBlockedUsers = useCallback(async () => {
        if (!excludeUid) return;
        const latestBlocked = await loadBlockedUids();
        
        // If the block list length changed (someone was blocked/unblocked)
        if (latestBlocked.length !== blockedUids.length) {
            setBlockedUids(latestBlocked);
            
            // Silently filter out the blocked user from the current view so we don't snap to page 1
            const blockedSet = new Set(latestBlocked);
            feedCache.items = feedCache.items.filter((item: any) => {
                const ownerId = item.ownerId || item.seller?.id || item.seller?.uid || item.userId;
                return ownerId ? !blockedSet.has(ownerId) : true;
            });
            setItems([...feedCache.items]);
        }
    }, [excludeUid, blockedUids.length, loadBlockedUids]);

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
            loadInitial(forceRefreshOnMount);
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
        syncBlockedUsers,
        refetch: () => loadInitial(true)
    };
}
