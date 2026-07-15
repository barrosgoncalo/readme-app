import { db } from './firebase.web';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';

const USERS_COLLECTION = 'users';

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
