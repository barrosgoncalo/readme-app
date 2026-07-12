import {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Send} from 'lucide-react';
import {ChatService} from '@readme/shared/src/services/chat';
import {fetchUserProfile} from '@readme/shared/src/services/users';
import {toMillis} from '@readme/shared/src/utils/timestamp';
import Spinner from '../../../components/Spinner.jsx';
import {WEB_ROUTES} from '../../../constants/webRoutes';
import OfferMessage from './OfferMessage.jsx';
import styles from './ChatConversation.module.css';

function formatMessageTime(createdAt) {
    const millis = toMillis(createdAt);
    if (!millis) return '';
    return new Date(millis).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}

export default function ChatConversation({chat, messages, loading, currentUserId}) {
    const navigate = useNavigate();
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const [otherUser, setOtherUser] = useState(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const otherUserId = chat.participants?.find(p => p !== currentUserId);

    useEffect(() => {
        const otherId = chat.participants?.find(p => p !== currentUserId);
        if (otherId) {
            fetchUserProfile(otherId)
                .then(profile => setOtherUser(profile))
                .catch(err => console.error(err));
        }
    }, [chat.participants, currentUserId]);

    const displayName = otherUser?.username || otherUser?.fullName || chat.sellerName || 'Chat';

    async function handleSend() {
        if (!text.trim() || !chat.id) return;

        setSending(true);
        try {
            await ChatService.sendTextMessage(chat.id, currentUserId, text);
            setText('');
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setSending(false);
        }
    }

    return (
        <div className={styles.conversation}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    {chat.targetBookImage && (
                        <img src={chat.targetBookImage} alt="" className={styles.bookImage}/>
                    )}
                    <div>
                        <h2
                            className={styles.name}
                            onClick={() => otherUserId && navigate(WEB_ROUTES.userProfile(otherUserId))}
                        >
                            {displayName}
                        </h2>
                        <p className={styles.subtitle}>{chat.lastMessage}</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className={styles.messagesContainer}>
                {loading ? (
                    <Spinner center label="Loading messages"/>
                ) : messages.length === 0 ? (
                    <p className={styles.empty}>No messages yet. Start the conversation!</p>
                ) : (
                    messages
                        .slice()
                        .reverse()
                        .map(msg => (
                            <div key={msg.id} className={styles.messageRow}>
                                {msg.type === 'offer' ? (
                                    <OfferMessage
                                        message={msg}
                                        isOwn={msg.senderId === currentUserId}
                                        currentUserId={currentUserId}
                                        chatId={chat.id}
                                        otherUserId={chat.participants?.find(p => p !== currentUserId)}
                                    />
                                ) : (
                                    <div
                                        className={`${styles.message} ${msg.senderId === currentUserId ? styles.own : styles.other}`}
                                    >
                                        <p className={styles.text}>{msg.text}</p>
                                        {formatMessageTime(msg.createdAt) && (
                                            <p className={styles.time}>{formatMessageTime(msg.createdAt)}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                )}
                <div ref={messagesEndRef}/>
            </div>

            {/* Composer */}
            <div className={styles.composer}>
                <input
                    type="text"
                    className={styles.input}
                    placeholder="Type a message..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && !sending && handleSend()}
                    disabled={sending}
                />
                <button
                    className={styles.sendBtn}
                    onClick={handleSend}
                    disabled={!text.trim() || sending}
                >
                    <Send size={18}/>
                </button>
            </div>
        </div>
    );
}
