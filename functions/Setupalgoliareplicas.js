// scripts/setupAlgoliaReplicas.js
//
// One-time (re-runnable) setup script that creates the replica indices
// needed for the search filter's sort options. Run this manually from
// your machine — do NOT wire this into the app or CI with a public key.
//
// Usage:
//   ALGOLIA_APP_ID=xxx ALGOLIA_ADMIN_KEY=xxx node scripts/setupAlgoliaReplicas.js
//
// Requires an Admin API key (found in Algolia dashboard > Settings > API Keys).
// The admin key can create/delete indices and modify settings — never expose
// it in the mobile app, only use it here, locally or in a trusted CI job.

const { algoliasearch } = require('algoliasearch');

const APP_ID = process.env.ALGOLIA_APP_ID;
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;

if (!APP_ID || !ADMIN_KEY) {
    console.error('Missing ALGOLIA_APP_ID or ALGOLIA_ADMIN_KEY env vars.');
    process.exit(1);
}

const client = algoliasearch(APP_ID, ADMIN_KEY);

const PRIMARY_INDEX = 'publications';

// Default Algolia ranking, used as the "rest" of the formula after our
// custom sort criterion takes priority.
const DEFAULT_RANKING_TAIL = ['typo', 'geo', 'words', 'filters', 'proximity', 'attribute', 'exact', 'custom'];

const REPLICAS = [
    { name: 'publications_title_asc', ranking: ['asc(book.title)', ...DEFAULT_RANKING_TAIL] },
    { name: 'publications_title_desc', ranking: ['desc(book.title)', ...DEFAULT_RANKING_TAIL] },
    { name: 'publications_favorites_desc', ranking: ['desc(stats.likesCount)', ...DEFAULT_RANKING_TAIL] },
    { name: 'publications_favorites_asc', ranking: ['asc(stats.likesCount)', ...DEFAULT_RANKING_TAIL] },
    { name: 'publications_date_desc', ranking: ['desc(createdAt)', ...DEFAULT_RANKING_TAIL] },
    { name: 'publications_date_asc', ranking: ['asc(createdAt)', ...DEFAULT_RANKING_TAIL] },
];

const FACET_ATTRIBUTES = ['filterOnly(status)', 'filterOnly(book.condition)', 'filterOnly(book.subject)'];

async function main() {
    console.log('Setting facets + linking replicas on primary index...');
    await client.setSettings({
        indexName: PRIMARY_INDEX,
        indexSettings: {
            replicas: REPLICAS.map((r) => r.name),
            attributesForFaceting: FACET_ATTRIBUTES,
        },
    });

    for (const replica of REPLICAS) {
        console.log(`Configuring ranking + facets for ${replica.name}...`);
        await client.setSettings({
            indexName: replica.name,
            indexSettings: {
                ranking: replica.ranking,
                attributesForFaceting: FACET_ATTRIBUTES,
            },
        });
    }

    console.log('Done. Replicas created/updated:');
    REPLICAS.forEach((r) => console.log(`  - ${r.name}`));
    console.log('\nNote: replicas can take a few seconds to finish indexing after creation.');
}

main().catch((err) => {
    console.error('Failed to set up replicas:', err);
    process.exit(1);
});