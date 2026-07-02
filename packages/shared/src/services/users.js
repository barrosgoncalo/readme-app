import { db } from './firebase';
import { collection, doc, getDoc, getDocs, query, where, documentId } from 'firebase/firestore';

const USERS_COLLECTION = 'users';

export async function getUserById(uid) {
    if (!uid) return null;
    const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
}

// Client-side search across users. Matches case-insensitively on username and
// fullName. Excludes the calling user and any user whose profile is private.
// Capped to `limit` results.
export async function searchUsers(queryStr, { excludeUid, limit = 20 } = {}) {
    const q = String(queryStr || '').trim().toLowerCase();
    if (!q) return [];
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    const out = [];
    for (const d of snap.docs) {
        if (excludeUid && d.id === excludeUid) continue;
        const data = d.data();
        const username = (data.username || '').toLowerCase();
        const fullName = (data.fullName || '').toLowerCase();
        if (username.includes(q) || fullName.includes(q)) {
            out.push({
                id: d.id,
                username: data.username || null,
                fullName: data.fullName || null,
                photoURL: data.photoURL || null,
            });
            if (out.length >= limit) break;
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
