import { timeAgo } from '@readme/shared/src/utils/timeAgo';
import styles from './ChatList.module.css';

export default function ChatList({ chats, activeChatId, onSelectChat }) {
    return (
        <div className={styles.list}>
            <h2 className={styles.title}>Messages</h2>
            {chats.length === 0 ? (
                <p className={styles.empty}>No messages yet</p>
            ) : (
                chats.map(chat => {
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
                                    {timeAgo(chat.updatedAt)}
                                </p>
                            )}
                        </button>
                    );
                })
            )}
        </div>
    );
}
