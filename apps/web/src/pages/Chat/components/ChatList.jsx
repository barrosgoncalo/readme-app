import {timeAgo} from '@readme/shared/src/utils/timeAgo';
import styles from './ChatList.module.css';

function ChatRow({chat, activeChatId, onSelectChat}) {
    const displayName = chat.targetSeller?.name || 'User';
    const avatarUrl = chat.targetSeller?.avatarUrl;

    let safeDate = chat.updatedAt;
    if (safeDate && typeof safeDate.toDate === 'function')
        safeDate = safeDate.toDate().toISOString();

    let displayTime = '';
    if (safeDate) {
        const timeStr = timeAgo(safeDate);
        displayTime = timeStr === 'Invalid Date' ? '' : timeStr;
    }

    return (
        <button
            className={`${styles.row} ${activeChatId === chat.id ? styles.active : ''}`}
            onClick={() => onSelectChat(chat.id)}
        >
            <div className={styles.thumbWrap}>
                {chat.imageUrl && (
                    <img src={chat.imageUrl} alt="" className={styles.thumbnail}/>
                )}
                {avatarUrl ? (
                    <img src={avatarUrl} alt="" className={styles.avatar}/>
                ) : (
                    <span className={styles.avatarPlaceholder} aria-hidden>
                        {displayName.charAt(0).toUpperCase()}
                    </span>
                )}
            </div>
            <div className={styles.info}>
                <p className={styles.name}>{displayName}</p>
                <p className={styles.preview}>{chat.lastMessage || 'No messages'}</p>
            </div>
            {displayTime && (
                <p className={styles.time}>{displayTime}</p>
            )}
        </button>
    );
}

export default function ChatList({chats, activeChatId, onSelectChat}) {
    const sortedChats = [...chats].sort((a, b) => {
        const getTime = (dateVal) => {
            if (!dateVal)
                return 0;
            if (typeof dateVal.toMillis === 'function')
                return dateVal.toMillis();
            if (typeof dateVal.toDate === 'function')
                return dateVal.toDate().getTime();
            return new Date(dateVal).getTime() || 0;
        };

        return getTime(b.updatedAt) - getTime(a.updatedAt);
    });

    return (
        <div className={styles.list}>
            <h2 className={styles.title}>
                Messages
            </h2>
            {sortedChats.length === 0 ? (
                <p className={styles.empty}>No messages yet</p>
            ) : (
                sortedChats.map(chat => (
                    <ChatRow
                        key={chat.id}
                        chat={chat}
                        activeChatId={activeChatId}
                        onSelectChat={onSelectChat}
                    />
                ))
            )}
        </div>
    );
}
