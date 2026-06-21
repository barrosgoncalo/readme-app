import { db } from './firebase.web';
import {
    collection, addDoc, getDocs, query, where, updateDoc, doc, collectionGroup,
} from 'firebase/firestore';
import { TRADE_STATUS } from '../constants/trade';

const TRADES_COLLECTION = 'trades';

export async function createTrade({ bookId, offeredBy, requestedFrom }) {
    const now = new Date().toISOString();
    const tradeRef = await addDoc(collection(db, TRADES_COLLECTION), {
        bookId,
        offeredBy,
        requestedFrom,
        status: TRADE_STATUS.PENDING,
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
    const myBooksGroup = collectionGroup(db, 'myBooks');
    const snapshot = await getDocs(myBooksGroup);
    const results = [];

    for (const bookDoc of snapshot.docs) {
        const ownerId = bookDoc.ref.parent.parent.id;
        if (ownerId === excludeUid) continue;

        const data = bookDoc.data();
        if (!data.availableForTrade) continue;

        results.push({
            bookId: data.bookId || bookDoc.id,
            ownerId,
            addedAt: data.addedAt,
            title: data.title || null,
            authors: data.authors || [],
            coverUrl: data.coverUrl || null,
        });
    }

    return results;
}
