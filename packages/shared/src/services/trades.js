import { db } from './firebase';
import {
    collection, addDoc, getDocs, query, where, updateDoc, doc,
} from 'firebase/firestore';

const TRADES_COLLECTION = 'trades';

export async function createTrade({ bookId, offeredBy, requestedFrom }) {
    const now = new Date().toISOString();
    const tradeRef = await addDoc(collection(db, TRADES_COLLECTION), {
        bookId,
        offeredBy,
        requestedFrom,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
    });
    return tradeRef.id;
}

export async function getIncomingTrades(uid) {
    const q = query(collection(db, TRADES_COLLECTION), where('requestedFrom', '==', uid));
    const snapshot = await getDocs(q);
    const trades = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    trades.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return trades;
}

export async function getOutgoingTrades(uid) {
    const q = query(collection(db, TRADES_COLLECTION), where('offeredBy', '==', uid));
    const snapshot = await getDocs(q);
    const trades = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    trades.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return trades;
}

export async function updateTradeStatus(tradeId, status) {
    const now = new Date().toISOString();
    const tradeRef = doc(db, TRADES_COLLECTION, tradeId);
    await updateDoc(tradeRef, {
        status,
        updatedAt: now,
    });
}

export async function getAvailableTradeBooks(excludeUid) {
    const booksRef = collection(db, 'users');
    const snapshot = await getDocs(booksRef);
    const results = [];

    for (const userDoc of snapshot.docs) {
        const uid = userDoc.id;
        if (uid === excludeUid) continue;

        const myBooksRef = collection(userDoc.ref, 'myBooks');
        const myBooksSnapshot = await getDocs(myBooksRef);

        for (const bookDoc of myBooksSnapshot.docs) {
            results.push({
                bookId: bookDoc.id,
                ownerId: uid,
                addedAt: bookDoc.data().addedAt,
            });
        }
    }

    return results;
}
