import { db } from './firebase';
import { collection, doc, getDoc, getDocs, query, where, documentId, limit as fsLimit } from 'firebase/firestore';

const USERS_COLLECTION = 'users';

export async function getUserById(uid) {
    if (!uid) return null;
    const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
}

// Searches users via Firestore prefix-range queries on `username` and `fullName`.
// Two parallel queries are merged and deduplicated. This avoids a full-collection
// scan (which caused intermittent 503s under Firestore load).
// username search lowercases the input (usernames are stored lowercase);
// fullName search uses the original casing typed by the user.
export async function searchUsers(queryStr, { excludeUid, limit = 20 } = {}) {
    const raw = String(queryStr || '').trim();
    if (!raw) return [];

    const qLower = raw.toLowerCase();

    const [byUsername, byFullName] = await Promise.all([
        getDocs(query(
            collection(db, USERS_COLLECTION),
            where('username', '>=', qLower),
            where('username', '<=', qLower + ''),
            fsLimit(limit + 10),
        )).catch(() => ({ docs: [] })),
        getDocs(query(
            collection(db, USERS_COLLECTION),
            where('fullName', '>=', raw),
            where('fullName', '<=', raw + ''),
            fsLimit(limit + 10),
        )).catch(() => ({ docs: [] })),
    ]);

    const seen = new Set();
    const out = [];
    for (const snap of [byUsername, byFullName]) {
        for (const d of snap.docs) {
            if (seen.has(d.id) || (excludeUid && d.id === excludeUid)) continue;
            seen.add(d.id);
            const data = d.data();
            out.push({
                id: d.id,
                username: data.username || null,
                fullName: data.fullName || null,
                photoURL: data.photoURL || null,
            });
            if (out.length >= limit) return out;
        }
    }
    return out;
}

export async function getUsersByIds(uids) {
    if (!uids || uids.length === 0) return {};

    const chunks = [];
    for (let i = 0; i < uids.length; i += 10) {
        chunks.push(uids.slice(i, i + 10));
    }

    const results = await Promise.all(
        chunks.map(async (chunk) => {
            const q = query(
                collection(db, USERS_COLLECTION),
                where(documentId(), 'in', chunk),
            );
            const snapshot = await getDocs(q);
            const map = {};
            snapshot.docs.forEach((d) => {
                map[d.id] = {
                    username: d.data().username,
                    fullName: d.data().fullName,
                    photoURL: d.data().photoURL || null,
                };
            });
            return map;
        })
    );

    return results.reduce((acc, map) => ({ ...acc, ...map }), {});
}
