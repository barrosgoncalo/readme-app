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
    reportsTotal: 0,
    reportsByType: [],
    activeAccounts: 0,
    accountsByRank: [],
    activeTrades: 0,
    publications: 0,
    publicationsByCountry: [],
};

export function useAdminDashboard() {
    const [state, setState] = useState(emptyState);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const [
                    reportsTotal,
                    reportsByType,
                    activeAccounts,
                    accountsByRank,
                    activeTrades,
                    publications,
                    publicationsByCountry,
                ] = await Promise.all([
                    // Total reports
                    DB.count('reports'),

                    // Reports broken down by target type
                    Promise.all(REPORT_TARGET_TYPES.map(async (targetType) => ({
                        targetType,
                        count: await DB.count('reports', [
                            { field: 'targetType', operator: '==', value: targetType },
                        ]),
                    }))),

                    // Active accounts
                    DB.count(USERS_COLLECTION(), [
                        { field: 'accountStatus', operator: '==', value: ACCOUNT_STATUS.ACTIVE },
                    ]),

                    // Active accounts, broken down by gamification rank
                    Promise.all(RANK_ORDER.map(async (rank) => ({
                        rank,
                        count: await DB.count(USERS_COLLECTION(), [
                            { field: 'accountStatus', operator: '==', value: ACCOUNT_STATUS.ACTIVE },
                            { field: 'gamification.rank', operator: '==', value: rank },
                        ]),
                    }))),

                    // Active trades: accepted offer messages across every chat.
                    // First run will likely prompt Firestore to ask you to create
                    // a composite index for this collection-group query — follow
                    // the link in the console error, it's a one-time setup.
                    DB.countCollectionGroup('messages', [
                        { field: 'type', operator: '==', value: 'offer' },
                        { field: 'status', operator: '==', value: NEGOTIATION_STATUS.ACCEPTED },
                    ]),

                    // Live publications
                    DB.count('publications', [
                        { field: 'status', operator: '==', value: PUBLICATION_STATUS.AVAILABLE },
                    ]),

                    // Publications by country, via Algolia facets
                    getPublicationsCountsByCountry(),
                ]);

                if (cancelled) return;

                setState({
                    loading: false,
                    error: null,
                    reportsTotal,
                    reportsByType,
                    activeAccounts,
                    accountsByRank,
                    activeTrades,
                    publications,
                    publicationsByCountry,
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