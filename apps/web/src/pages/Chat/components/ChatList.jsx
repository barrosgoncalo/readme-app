import {useEffect, useState} from 'react';
import {timeAgo} from '@readme/shared/src/utils/timeAgo';
import {fetchUserProfile} from '@readme/shared/src/services/users';
import styles from './ChatList.module.css';

function ChatRow({chat, activeChatId, onSelectChat, currentUserId}) {
    const [otherUser, setOtherUser] = useState(null);

    useEffect(() => {
        const otherId = chat.participants?.find(p => p !== currentUserId);
        if (otherId)
            fetchUserProfile(otherId)
                .then(profile => setOtherUser(profile))
                .catch(err => console.error(err));
    }, [chat.participants, currentUserId]);

    const displayName = otherUser?.username || otherUser?.fullName || chat.sellerName || 'User';

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
            {chat.targetBookImage && (
                <img src={chat.targetBookImage} alt="" className={styles.thumbnail}/>
            )}
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

export default function ChatList({chats, activeChatId, onSelectChat, isSidebarOpen, currentUserId}) {
    return (
        <div className={styles.list}>
            <h2 className={`${styles.title} ${!isSidebarOpen ? styles.titleShifted : ''}`}>
                Messages
            </h2>
            {chats.length === 0 ? (
                <p className={styles.empty}>No messages yet</p>
            ) : (
                chats.map(chat => (
                    <ChatRow
                        key={chat.id}
                        chat={chat}
                        activeChatId={activeChatId}
                        onSelectChat={onSelectChat}
                        currentUserId={currentUserId}
                    />
                ))
            )}
        </div>
    );
}
