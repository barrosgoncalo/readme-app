import UserAvatar from '../../../components/UserAvatar.jsx';
import styles from './ChatList.module.css';

function formatDistanceToNow(date) {
    const now = Date.now();
    const time = new Date(date).getTime();
    const diffMs = now - time;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
}

export default function ChatList({ chats, activeChatId, onSelectChat, userDetails }) {
    return (
        <div className={styles.list}>
            <h2 className={styles.title}>Messages</h2>
            {chats.length === 0 ? (
                <p className={styles.empty}>No messages yet</p>
            ) : (
                chats.map(chat => {
                    const otherUid = chat.participants?.find(p => p !== userDetails[p]?.id);
                    const otherUser = userDetails[otherUid] || {};

                    return (
                        <button
                            key={chat.id}
                            className={`${styles.row} ${activeChatId === chat.id ? styles.active : ''}`}
                            onClick={() => onSelectChat(chat.id)}
                        >
                            {chat.targetBookImage && (
                                <img src={chat.targetBookImage} alt="" className={styles.thumbnail} />
                            )}
                            <div className={styles.info}>
                                <p className={styles.name}>{chat.sellerName || 'User'}</p>
                                <p className={styles.preview}>{chat.lastMessage || 'No messages'}</p>
                            </div>
                            {chat.updatedAt && (
                                <p className={styles.time}>
                                    {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: false })}
                                </p>
                            )}
                        </button>
                    );
                })
            )}
        </div>
    );
}
