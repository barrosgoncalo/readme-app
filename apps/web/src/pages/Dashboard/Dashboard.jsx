import { useState } from 'react';
import { useAdminDashboard } from '@readme/shared/src/hooks/use-admin-dashboard';
import StatCards from './StatCards.jsx';
import ReportsByTypeChart from './ReportsByTypeChart.jsx';
import AccountsByRankChart from './AccountsByRankChart.jsx';
import PublicationsByCountryList from './PublicationsByCountryList.jsx';
import PublicationsByDateChart from './PublicationsByDateChart.jsx';
import styles from './Dashboard.module.css';

const GRANULARITY_OPTIONS = [
    { value: 'day', label: 'Day' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
];

export default function Dashboard() {
    const [publicationsDateGranularity, setPublicationsDateGranularity] = useState('month');

    const {
        loading,
        error,
        warnings,
        reportsTotal,
        reportsByType,
        activeAccounts,
        accountsByRank,
        activeTrades,
        publications,
        publicationsByCountry,
        publicationsByDate,
        publicationsByDateLoading,
    } = useAdminDashboard({ publicationsDateGranularity });

    const activeTradesUnavailable = warnings.includes('activeTrades');

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Dashboard</h1>
                    <p className={styles.subtitle}>An overview of what's happening across the app.</p>
                </div>
            </div>

            {error && (
                <div className={styles.errorBanner}>
                    Couldn't load some dashboard data. Try refreshing the page.
                </div>
            )}

            {!error && warnings.length > 0 && (
                <div className={styles.warningBanner}>
                    {activeTradesUnavailable
                        ? 'Active trades are temporarily unavailable while Firestore finishes building the required index. Other dashboard metrics are up to date.'
                        : 'Some dashboard metrics are temporarily unavailable. Try refreshing the page in a moment.'}
                </div>
            )}

            <StatCards
                loading={loading}
                reportsTotal={reportsTotal}
                activeAccounts={activeAccounts}
                activeTrades={activeTrades}
                publications={publications}
            />

            <div className={styles.grid}>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Reports by reason</h2>
                    <ReportsByTypeChart data={reportsByType} loading={loading} />
                </div>

                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Accounts by rank</h2>
                    <AccountsByRankChart data={accountsByRank} loading={loading} />
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeaderRow}>
                    <h2 className={styles.cardTitle}>Publications over time</h2>
                    <div className={styles.segmentedControl} role="group" aria-label="Chart granularity">
                        {GRANULARITY_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={`${styles.segmentedOption} ${
                                    publicationsDateGranularity === option.value ? styles.segmentedOptionActive : ''
                                }`}
                                aria-pressed={publicationsDateGranularity === option.value}
                                onClick={() => setPublicationsDateGranularity(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
                <PublicationsByDateChart data={publicationsByDate} loading={publicationsByDateLoading} />
            </div>

            <div className={styles.card}>
                <h2 className={styles.cardTitle}>Publications by country</h2>
                <PublicationsByCountryList data={publicationsByCountry} loading={loading} />
            </div>
        </div>
    );
}