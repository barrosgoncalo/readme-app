// @readme/shared/src/hooks/use-admin-dashboard.js

import { useEffect, useState } from 'react';
import { DB } from '../services/DB';
import { getPublicationsCountsByCountry } from '../services/searchBook';
import { PUBLICATION_STATUS, NEGOTIATION_STATUS, REPORT_REASON_LABELS } from '../constants/status';
import { ACCOUNT_STATUS } from '../constants/authConstants';
import { RankTitles } from '../constants/gamification';

const REPORT_REASONS = Object.keys(REPORT_REASON_LABELS);

const RANK_ORDER = Object.values(RankTitles);

const emptyState = {
    loading: true,
    error: null,
    warnings: [],
    reportsTotal: 0,
    reportsByType: [],
    activeAccounts: 0,
    accountsByRank: [],
    activeTrades: null,
    publications: 0,
    publicationsByCountry: [],
    publicationsByDate: [],
    publicationsByDateLoading: true,
};

async function loadMetric(label, loader, fallback) {
    try {
        return { label, value: await loader(), warning: null };
    } catch (error) {
        console.warn(`useAdminDashboard: ${label} unavailable`, error);
        return { label, value: fallback, warning: error };
    }
}

// Default lookback window per granularity. Chosen so each bucket count stays
// readable on the chart (~30 points max) without needing a full date picker.
function getDateRangeForGranularity(granularity) {
    const dateTo = new Date();
    const dateFrom = new Date(dateTo);

    if (granularity === 'day') {
        dateFrom.setDate(dateFrom.getDate() - 29); // last 30 days, inclusive of today
    } else if (granularity === 'year') {
        dateFrom.setFullYear(dateFrom.getFullYear() - 5); // last 6 years, inclusive of this year
    } else {
        dateFrom.setMonth(dateFrom.getMonth() - 11); // last 12 months, inclusive of this month
    }

    return { dateFrom, dateTo };
}

// Builds contiguous [start, end) buckets covering dateFrom..dateTo at the
// requested granularity, each with a chart-friendly label.
function buildDateBuckets(dateFrom, dateTo, granularity) {
    const buckets = [];

    if (granularity === 'day') {
        const cursor = new Date(dateFrom);
        cursor.setHours(0, 0, 0, 0);
        while (cursor <= dateTo) {
            const start = new Date(cursor);
            const end = new Date(cursor);
            end.setDate(end.getDate() + 1);
            buckets.push({
                label: start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                start,
                end,
            });
            cursor.setDate(cursor.getDate() + 1);
        }
    } else if (granularity === 'year') {
        const cursor = new Date(dateFrom.getFullYear(), 0, 1);
        while (cursor <= dateTo) {
            const start = new Date(cursor);
            const end = new Date(cursor.getFullYear() + 1, 0, 1);
            buckets.push({
                label: String(start.getFullYear()),
                start,
                end,
            });
            cursor.setFullYear(cursor.getFullYear() + 1);
        }
    } else {
        // month
        const cursor = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), 1);
        while (cursor <= dateTo) {
            const start = new Date(cursor);
            const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
            buckets.push({
                label: start.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
                start,
                end,
            });
            cursor.setMonth(cursor.getMonth() + 1);
        }
    }

    return buckets;
}

// Counts publications created in each bucket. Deliberately NOT filtered by
// PUBLICATION_STATUS.AVAILABLE (unlike the `publications` stat card) — this
// chart is meant to show publishing activity over time, including listings
// that have since been swapped or removed, not just what's live right now.
async function loadPublicationsByDate(granularity) {
    const { dateFrom, dateTo } = getDateRangeForGranularity(granularity);
    const buckets = buildDateBuckets(dateFrom, dateTo, granularity);

    return Promise.all(
        buckets.map(async (bucket) => ({
            label: bucket.label,
            count: await DB.count('publications', [
                { field: 'createdAt', operator: '>=', value: bucket.start },
                { field: 'createdAt', operator: '<', value: bucket.end },
            ]),
        })),
    );
}

export function useAdminDashboard({ publicationsDateGranularity = 'month' } = {}) {
    const [state, setState] = useState(emptyState);

    // Main dashboard load — runs once. Independent of the date-granularity
    // toggle so switching Day/Month/Year doesn't re-fetch everything else.
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const [
                    reportsTotalResult,
                    reportsByTypeResult,
                    activeAccountsResult,
                    accountsByRankResult,
                    activeTradesResult,
                    publicationsResult,
                    publicationsByCountryResult,
                ] = await Promise.all([
                    loadMetric('reportsTotal', () => DB.count('reports'), 0),

                    loadMetric(
                        'reportsByType',
                        () => Promise.all(REPORT_REASONS.map(async (reason) => ({
                            reason,
                            count: await DB.count('reports', [
                                { field: 'reason', operator: '==', value: reason },
                            ]),
                        }))),
                        [],
                    ),

                    loadMetric(
                        'activeAccounts',
                        () => DB.count(USERS_COLLECTION(), [
                            { field: 'accountStatus', operator: '==', value: ACCOUNT_STATUS.ACTIVE },
                        ]),
                        0,
                    ),

                    loadMetric(
                        'accountsByRank',
                        () => Promise.all(RANK_ORDER.map(async (rank) => ({
                            rank,
                            count: await DB.count(USERS_COLLECTION(), [
                                { field: 'accountStatus', operator: '==', value: ACCOUNT_STATUS.ACTIVE },
                                { field: 'gamification.rank', operator: '==', value: rank },
                            ]),
                        }))),
                        [],
                    ),

                    // Active trades: accepted offer messages across every chat.
                    // Requires a one-time Firestore composite index on the messages
                    // collection group. While the index is building, this metric
                    // loads as unavailable instead of blocking the whole dashboard.
                    loadMetric(
                        'activeTrades',
                        () => DB.countCollectionGroup('messages', [
                            { field: 'type', operator: '==', value: 'offer' },
                            { field: 'offerDetails.status', operator: '==', value: NEGOTIATION_STATUS.ACCEPTED },
                        ]),
                        null,
                    ),

                    loadMetric(
                        'publications',
                        () => DB.count('publications', [
                            { field: 'status', operator: '==', value: PUBLICATION_STATUS.AVAILABLE },
                        ]),
                        0,
                    ),

                    loadMetric('publicationsByCountry', () => getPublicationsCountsByCountry(), []),
                ]);

                if (cancelled) return;

                const warnings = [
                    reportsTotalResult,
                    reportsByTypeResult,
                    activeAccountsResult,
                    accountsByRankResult,
                    activeTradesResult,
                    publicationsResult,
                    publicationsByCountryResult,
                ]
                    .filter((result) => result.warning)
                    .map((result) => result.label);

                setState((prev) => ({
                    ...prev,
                    loading: false,
                    error: null,
                    warnings,
                    reportsTotal: reportsTotalResult.value,
                    reportsByType: reportsByTypeResult.value,
                    activeAccounts: activeAccountsResult.value,
                    accountsByRank: accountsByRankResult.value,
                    activeTrades: activeTradesResult.value,
                    publications: publicationsResult.value,
                    publicationsByCountry: publicationsByCountryResult.value,
                }));
            } catch (error) {
                console.error('useAdminDashboard failed to load:', error);
                if (!cancelled) {
                    setState((prev) => ({ ...prev, loading: false, error }));
                }
            }
        };

        load();
        return () => { cancelled = true; };
    }, []);

    // Publications-over-time load — re-runs whenever the granularity toggle
    // changes, without disturbing the rest of the dashboard state.
    useEffect(() => {
        let cancelled = false;
        setState((prev) => ({ ...prev, publicationsByDateLoading: true }));

        loadMetric('publicationsByDate', () => loadPublicationsByDate(publicationsDateGranularity), []).then(
            (result) => {
                if (cancelled) return;
                setState((prev) => ({
                    ...prev,
                    publicationsByDate: result.value,
                    publicationsByDateLoading: false,
                    warnings: result.warning
                        ? [...prev.warnings.filter((w) => w !== 'publicationsByDate'), 'publicationsByDate']
                        : prev.warnings.filter((w) => w !== 'publicationsByDate'),
                }));
            },
        );

        return () => { cancelled = true; };
    }, [publicationsDateGranularity]);

    return state;
}

// Kept as a function rather than a bare constant so it reads consistently
// with how the rest of the services reference their collection names.
function USERS_COLLECTION() {
    return 'users';
}