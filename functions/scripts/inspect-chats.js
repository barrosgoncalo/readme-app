// Read-only diagnostic script for investigating the shared Firebase project's
// `chats` collection. Requires a service-account key at .secrets/service-account.json
// (repo root, gitignored) with a read-only IAM role (e.g. Cloud Datastore Viewer).
//
// Usage (from functions/):
//   node scripts/inspect-chats.js <uidA> [uidB]
//
// With one uid: lists every chat that uid participates in.
// With two uids: also checks specifically for a chat containing both.

const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const keyPath = path.resolve(__dirname, '../../.secrets/service-account.json');

let serviceAccount;
try {
    serviceAccount = require(keyPath);
} catch {
    console.error(`Could not load service account key at ${keyPath}`);
    console.error('Generate one in Firebase Console → Project Settings → Service Accounts,');
    console.error('save it to that path, and make sure the IAM role is read-only.');
    process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
    const [uidA, uidB] = process.argv.slice(2);
    if (!uidA) {
        console.error('Usage: node scripts/inspect-chats.js <uidA> [uidB]');
        process.exit(1);
    }

    const snap = await db.collection('chats')
        .where('participants', 'array-contains', uidA)
        .get();

    console.log(`Found ${snap.size} chat(s) for uid ${uidA}:\n`);

    for (const doc of snap.docs) {
        const data = doc.data();
        const messagesSnap = await doc.ref.collection('messages').get();
        console.log(`- ${doc.id}`);
        console.log(`  participants: ${JSON.stringify(data.participants)}`);
        console.log(`  createdAt: ${data.createdAt}, updatedAt: ${data.updatedAt}`);
        console.log(`  lastMessage: ${data.lastMessage}`);
        console.log(`  messages subcollection: ${messagesSnap.size} doc(s)`);
        console.log('');
    }

    if (uidB) {
        const match = snap.docs.find(d => d.data().participants.includes(uidB));
        console.log(match
            ? `Chat between ${uidA} and ${uidB}: FOUND (${match.id})`
            : `Chat between ${uidA} and ${uidB}: NOT FOUND — no chat doc currently has both uids in participants.`);
    }
}

main().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
