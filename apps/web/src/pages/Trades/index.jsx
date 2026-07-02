import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { getAvailableTradeBooks, getIncomingTrades, getOutgoingTrades, createTrade as createTradeService, updateTradeStatus } from '@readme/shared/src/services/trades';
import { getBooksByIds } from '@readme/shared/src/services/booksCatalog';
import { getUsersByIds } from '@readme/shared/src/services/users';
import { doGetBlockedUids } from '@readme/shared/src/services/blockUser';
import { TRADE_STATUS } from '@readme/shared/src/constants/trade';
import Spinner from '../../components/Spinner.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import Button from '../../components/Button.jsx';
import AvailableBookCard from './components/AvailableBookCard.jsx';
import TradeRequestCard from './components/TradeRequestCard.jsx';
import styles from './Trades.module.css';

export default function Trades() {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;

    const [tab, setTab] = useState('browse'); // 'browse' | 'incoming' | 'outgoing'
    const [availableBooks, setAvailableBooks] = useState([]);
    const [incomingTrades, setIncomingTrades] = useState([]);
    const [outgoingTrades, setOutgoingTrades] = useState([]);
    const [bookDetails, setBookDetails] = useState({});
    const [userDetails, setUserDetails] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busyIds, setBusyIds] = useState(new Set());

    const load = useCallback(async () => {
        if (!uid) return;
        setLoading(true);
        setError(null);
        try {
            const [available, incoming, outgoing, blockedUids] = await Promise.all([
                getAvailableTradeBooks(uid),
                getIncomingTrades(uid),
                getOutgoingTrades(uid),
                doGetBlockedUids(uid).catch(() => new Set()),
            ]);

            const filteredAvailable = available.filter(b => !blockedUids.has(b.ownerId));
            const filteredIncoming = incoming.filter(t => !blockedUids.has(t.offeredBy));
            const filteredOutgoing = outgoing.filter(t => !blockedUids.has(t.requestedFrom));

            setAvailableBooks(filteredAvailable);
            setIncomingTrades(filteredIncoming);
            setOutgoingTrades(filteredOutgoing);

            // Collect unique book and user IDs
            const bookIds = new Set();
            const userIds = new Set();

            filteredAvailable.forEach((item) => {
                bookIds.add(item.bookId);
                userIds.add(item.ownerId);
            });
            filteredIncoming.forEach((trade) => {
                bookIds.add(trade.bookId);
                userIds.add(trade.offeredBy);
            });
            filteredOutgoing.forEach((trade) => {
                bookIds.add(trade.bookId);
                userIds.add(trade.requestedFrom);
            });

            // Build a map of embedded book metadata from the trade items themselves
            const embeddedMap = {};
            filteredAvailable.forEach((item) => {
                embeddedMap[item.bookId] = {
                    id: item.bookId,
                    title: item.title,
                    authors: item.authors,
                    coverUrl: item.coverUrl,
                };
            });

            // Hydrate from catalog (supplements embedded data; fills in books without embedded fields)
            if (bookIds.size > 0) {
                try {
                    const books = await getBooksByIds(Array.from(bookIds));
                    const booksMap = { ...embeddedMap };
                    books.forEach((b) => {
                        booksMap[b.id] = {
                            ...embeddedMap[b.id],
                            ...b,
                        };
                    });
                    setBookDetails(booksMap);
                } catch {
                    setBookDetails(embeddedMap);
                }
            } else {
                setBookDetails(embeddedMap);
            }

            if (userIds.size > 0) {
                const users = await getUsersByIds(Array.from(userIds));
                setUserDetails(users);
            }
        } catch (err) {
            setError(err.message || 'Could not load trades.');
        } finally {
            setLoading(false);
        }
    }, [uid]);

    useEffect(() => { load(); }, [load]);

    async function handleRequestTrade(bookId, ownerId) {
        if (!uid || busyIds.has(`${bookId}:${ownerId}`)) return;

        const key = `${bookId}:${ownerId}`;
        setBusyIds((prev) => new Set(prev).add(key));
        try {
            await createTradeService({ bookId, offeredBy: uid, requestedFrom: ownerId });
            await load();
        } catch (err) {
            setError(err.message || 'Could not request trade.');
        } finally {
            setBusyIds((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }
    }

    async function handleUpdateStatus(tradeId, newStatus) {
        if (!uid) return;
        setBusyIds((prev) => new Set(prev).add(tradeId));
        try {
            await updateTradeStatus(tradeId, newStatus);
            await load();
        } catch (err) {
            setError(err.message || 'Could not update trade.');
        } finally {
            setBusyIds((prev) => {
                const next = new Set(prev);
                next.delete(tradeId);
                return next;
            });
        }
    }

    if (loading) return <div className={styles.page}><Spinner center label="Loading trades" /></div>;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Book Trades</h1>
            </div>

            <ErrorAlert>{error}</ErrorAlert>

            <div className={styles.tabs}>
                <button
                    type="button"
                    className={`${styles.tab} ${tab === 'browse' ? styles.tabActive : ''}`}
                    onClick={() => setTab('browse')}
                >
                    Browse
                </button>
                <button
                    type="button"
                    className={`${styles.tab} ${tab === 'incoming' ? styles.tabActive : ''}`}
                    onClick={() => setTab('incoming')}
                >
                    Incoming
                </button>
                <button
                    type="button"
                    className={`${styles.tab} ${tab === 'outgoing' ? styles.tabActive : ''}`}
                    onClick={() => setTab('outgoing')}
                >
                    Outgoing
                </button>
            </div>

            <div className={styles.content}>
                {tab === 'browse' && (
                    availableBooks.length === 0 ? (
                        <div className={styles.empty}>
                            <p className={styles.emptyTitle}>No books to trade</p>
                            <p>Other members haven't added books yet.</p>
                        </div>
                    ) : (
                        <div className={styles.list}>
                            {availableBooks.map((item) => (
                                <AvailableBookCard
                                    key={`${item.bookId}:${item.ownerId}`}
                                    book={bookDetails[item.bookId] || { id: item.bookId, title: 'Untitled', authors: [] }}
                                    ownerName={userDetails[item.ownerId]?.username || 'Unknown'}
                                    onRequestTrade={() => handleRequestTrade(item.bookId, item.ownerId)}
                                    busy={busyIds.has(`${item.bookId}:${item.ownerId}`)}
                                    disableRequest={outgoingTrades.some(
                                        (t) => t.bookId === item.bookId && t.requestedFrom === item.ownerId && t.status === TRADE_STATUS.PENDING
                                    )}
                                />
                            ))}
                        </div>
                    )
                )}

                {tab === 'incoming' && (
                    incomingTrades.length === 0 ? (
                        <div className={styles.empty}>
                            <p className={styles.emptyTitle}>No incoming requests</p>
                            <p>When someone requests a trade, it'll appear here.</p>
                        </div>
                    ) : (
                        <div className={styles.list}>
                            {incomingTrades.map((trade) => (
                                <TradeRequestCard
                                    key={trade.id}
                                    trade={trade}
                                    book={bookDetails[trade.bookId] || { id: trade.bookId, title: 'Untitled', authors: [] }}
                                    otherPartyName={userDetails[trade.offeredBy]?.username || 'Unknown'}
                                    isIncoming
                                    onAccept={() => handleUpdateStatus(trade.id, TRADE_STATUS.ACCEPTED)}
                                    onDecline={() => handleUpdateStatus(trade.id, TRADE_STATUS.DECLINED)}
                                    onComplete={() => handleUpdateStatus(trade.id, TRADE_STATUS.COMPLETED)}
                                    busy={busyIds.has(trade.id)}
                                />
                            ))}
                        </div>
                    )
                )}

                {tab === 'outgoing' && (
                    outgoingTrades.length === 0 ? (
                        <div className={styles.empty}>
                            <p className={styles.emptyTitle}>No outgoing requests</p>
                            <p>Browse available books to start a trade.</p>
                        </div>
                    ) : (
                        <div className={styles.list}>
                            {outgoingTrades.map((trade) => (
                                <TradeRequestCard
                                    key={trade.id}
                                    trade={trade}
                                    book={bookDetails[trade.bookId] || { id: trade.bookId, title: 'Untitled', authors: [] }}
                                    otherPartyName={userDetails[trade.requestedFrom]?.username || 'Unknown'}
                                    isIncoming={false}
                                    onDecline={() => handleUpdateStatus(trade.id, TRADE_STATUS.DECLINED)}
                                    onComplete={() => handleUpdateStatus(trade.id, TRADE_STATUS.COMPLETED)}
                                    busy={busyIds.has(trade.id)}
                                />
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
