// @readme/shared/src/hooks/use-admin-dashboard.js

import { useEffect, useState } from 'react';
import { DB } from '../services/DB';
import { getPublicationsCountsByCountry } from '../services/searchBook';
import { PUBLICATION_STATUS, NEGOTIATION_STATUS } from '../constants/status';
import { ACCOUNT_STATUS } from '../constants/authConstants';
import { RankTitles } from '../constants/gamification';

// Adjust these to match the actual targetType values you write on report
// docs (see ReportsService.submitReport callers — targetType is whatever
// string gets passed there, e.g. 'chat' | 'publication' | 'account').
const REPORT_TARGET_TYPES = ['chat', 'publication', 'account'];

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
};

async function loadMetric(label, loader, fallback) {
    try {
        return { label, value: await loader(), warning: null };
    } catch (error) {
        console.warn(`useAdminDashboard: ${label} unavailable`, error);
        return { label, value: fallback, warning: error };
    }
}

export function useAdminDashboard() {
    const [state, setState] = useState(emptyState);

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
                        () => Promise.all(REPORT_TARGET_TYPES.map(async (targetType) => ({
                            targetType,
                            count: await DB.count('reports', [
                                { field: 'targetType', operator: '==', value: targetType },
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

                setState({
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
                });
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

    return state;
}

// Kept as a function rather than a bare constant so it reads consistently
// with how the rest of the services reference their collection names.
function USERS_COLLECTION() {
    return 'users';
}