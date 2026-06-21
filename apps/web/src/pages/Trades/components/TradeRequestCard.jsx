import { BookOpen } from 'lucide-react';
import { TRADE_STATUS } from '@readme/shared/src/constants/trade';
import Button from '../../../components/Button.jsx';
import styles from './TradeRequestCard.module.css';

const STATUS_LABEL = {
    [TRADE_STATUS.PENDING]: 'Pending',
    [TRADE_STATUS.ACCEPTED]: 'Accepted',
    [TRADE_STATUS.DECLINED]: 'Declined',
    [TRADE_STATUS.COMPLETED]: 'Completed',
};

export default function TradeRequestCard({
    trade, book, otherPartyName, isIncoming, onAccept, onDecline, onComplete, busy,
}) {
    const authors = Array.isArray(book.authors) ? book.authors.join(', ') : book.authors;
    const statusLabel = STATUS_LABEL[trade.status] || trade.status;

    return (
        <div className={styles.card}>
            {book.coverUrl ? (
                <img src={book.coverUrl} alt="" className={styles.cover} />
            ) : (
                <div className={`${styles.cover} ${styles.placeholder}`} aria-hidden>
                    <BookOpen size={24} />
                </div>
            )}

            <div className={styles.body}>
                <div>
                    <p className={styles.title}>{book.title || 'Untitled'}</p>
                    <p className={styles.authors}>{authors || 'Unknown author'}</p>
                    <p className={styles.party}>
                        {isIncoming ? `Requested by ${otherPartyName}` : `Requested from ${otherPartyName}`}
                    </p>
                </div>

                <div className={styles.footer}>
                    <span className={`${styles.badge} ${styles[`badge${trade.status}`]}`}>
                        {statusLabel}
                    </span>

                    <div className={styles.actions}>
                        {isIncoming && trade.status === TRADE_STATUS.PENDING && (
                            <>
                                <Button
                                    variant="ghost"
                                    onClick={onDecline}
                                    disabled={busy}
                                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                                >
                                    Decline
                                </Button>
                                <Button
                                    onClick={onAccept}
                                    disabled={busy}
                                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                                >
                                    Accept
                                </Button>
                            </>
                        )}

                        {trade.status === TRADE_STATUS.ACCEPTED && (
                            <Button
                                onClick={onComplete}
                                disabled={busy}
                                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                            >
                                Mark complete
                            </Button>
                        )}

                        {!isIncoming && trade.status === TRADE_STATUS.PENDING && (
                            <Button
                                variant="ghost"
                                onClick={onDecline}
                                disabled={busy}
                                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
