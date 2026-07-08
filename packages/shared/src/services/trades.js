import { DB } from './DB';

const TRADES_COLLECTION = 'trades';

export async function createTrade({ bookId, offeredBy, requestedFrom }) {
    return await DB.create(TRADES_COLLECTION, {
        bookId,
        offeredBy,
        requestedFrom,
        status: 'pending',
    });
}

export async function getIncomingTrades(uid) {
    const trades = await DB.get(TRADES_COLLECTION, [
        { field: 'requestedFrom', operator: '==', value: uid }
    ]);
    
    return trades.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getOutgoingTrades(uid) {
    const trades = await DB.get(TRADES_COLLECTION, [
        { field: 'offeredBy', operator: '==', value: uid }
    ]);
    
    return trades.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function updateTradeStatus(tradeId, status) {
    await DB.update(TRADES_COLLECTION, tradeId, { status });
}

export async function getAvailableTradeBooks(excludeUid) {
    const users = await DB.get('users', []);
    const results = [];

    for (const user of users) {
        const uid = user.id;
        if (uid === excludeUid) continue;

        const myBooks = await DB.get(`users/${uid}/myBooks`, []);

        for (const book of myBooks) {
            results.push({
                bookId: book.id,
                ownerId: uid,
                addedAt: book.addedAt,
            });
        }
    }

    return results;
}
