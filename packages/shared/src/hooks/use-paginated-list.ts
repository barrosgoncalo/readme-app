import { useState, useCallback, useRef } from 'react';
/**
 * Generic infinite-scroll pagination.
 *
 * Data stays in memory (up to `maxItems`, a safety ceiling — not a
 * normal trimming mechanism). Rendering cost is handled separately by
 * FlatList's own virtualization (windowSize/removeClippedSubviews),
 * so scrolling back up shows real data, not gaps.
 *
 * Source-agnostic: pass a `fetchPage` adapter and it works for Algolia,
 * Firestore, or any REST endpoint.
 */
export function usePaginatedList({
                                     fetchPage,
                                     getId,
                                     maxItems = 1000,
                                 }) {
    const [items, setItems] = useState([]);
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);
    const cursorRef = useRef(null);
    const seenIdsRef = useRef(new Set());
    // Tracks the most recently-issued loadInitial/refresh call. StrictMode
    // (and rapid filter changes) can fire two of these back-to-back; when
    // an older call's response lands after a newer one has already reset
    // state, it must not be allowed to touch items/seenIdsRef anymore.
    const requestIdRef = useRef(0);

    const resetState = useCallback(() => {
        cursorRef.current = null;
        seenIdsRef.current = new Set();
        setHasMore(true);
        setError(null);
    }, []);
    const appendPage = useCallback((page) => {
        const fresh = page.items.filter((it) => {
            const id = getId(it);
            if (seenIdsRef.current.has(id)) return false;
            seenIdsRef.current.add(id);
            return true;
        });
        setItems((prev) => {
            const next = prev.concat(fresh);
            if (next.length <= maxItems) return next;
            // Safety valve only, rarely triggers in practice.
            const dropCount = next.length - maxItems;
            const dropped = next.slice(0, dropCount);
            dropped.forEach((it) => seenIdsRef.current.delete(getId(it)));
            return next.slice(dropCount);
        });
        cursorRef.current = page.nextCursor;
        setHasMore(page.hasMore);
    }, [getId, maxItems]);
    const loadInitial = useCallback(async () => {
        const requestId = ++requestIdRef.current;
        resetState();
        setIsLoadingInitial(true);
        try {
            const page = await fetchPage(null, { fresh: true });
            if (requestId !== requestIdRef.current) return; // superseded by a newer call
            setItems([]);
            appendPage(page);
        } catch (e) {
            if (requestId === requestIdRef.current) setError(e);
        } finally {
            if (requestId === requestIdRef.current) setIsLoadingInitial(false);
        }
    }, [fetchPage, resetState, appendPage]);
    const loadMore = useCallback(async () => {
        if (isLoadingMore || isLoadingInitial || isRefreshing || !hasMore) return;
        setIsLoadingMore(true);
        try {
            const page = await fetchPage(cursorRef.current, { fresh: false });
            appendPage(page);
        } catch (e) {
            setError(e);
        } finally {
            setIsLoadingMore(false);
        }
    }, [fetchPage, isLoadingMore, isLoadingInitial, isRefreshing, hasMore, appendPage]);
    const refresh = useCallback(async () => {
        const requestId = ++requestIdRef.current;
        resetState();
        setIsRefreshing(true);
        try {
            const page = await fetchPage(null, { fresh: true });
            if (requestId !== requestIdRef.current) return; // superseded by a newer call
            setItems([]);
            appendPage(page);
        } catch (e) {
            if (requestId === requestIdRef.current) setError(e);
        } finally {
            if (requestId === requestIdRef.current) setIsRefreshing(false);
        }
    }, [fetchPage, resetState, appendPage]);
    const updateItem = useCallback((id, updater) => {
        setItems((prev) => prev.map((it) => (getId(it) === id ? updater(it) : it)));
    }, [getId]);
    // Removes an item from the in-memory list only (does not affect any
    // underlying source-of-truth data). Also frees its id from the
    // dedupe set, so if it legitimately reappears on a later page it
    // won't be silently filtered out as a "duplicate".
    const removeItem = useCallback((id) => {
        setItems((prev) => prev.filter((it) => getId(it) !== id));
        seenIdsRef.current.delete(id);
    }, [getId]);
    return {
        items, isLoadingInitial, isLoadingMore, isRefreshing, hasMore, error,
        loadInitial, loadMore, refresh,
        updateItem, removeItem,
    };
}
