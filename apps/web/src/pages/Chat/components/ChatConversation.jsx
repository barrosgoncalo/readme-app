import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {useNavigate} from 'react-router-dom';
import {Send, Smile} from 'lucide-react';
import {ChatService} from '@readme/shared/src/services/chat';
import {UsersService} from '@readme/shared/src/services/users';
import {toMillis} from '@readme/shared/src/utils/timestamp';
import Spinner from '../../../components/Spinner.jsx';
import {WEB_ROUTES} from '../../../constants/webRoutes';
import OfferMessage from './OfferMessage.jsx';
import styles from './ChatConversation.module.css';

const EMOJI_OPTIONS = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '😐', '😑', '😶', '🙄', '😏', '😬', '🤥', '😌', '😔', '😪',
    '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🥵', '🥶', '😵',
    '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '😢',
    '😭', '😨', '😩', '😰', '😱', '😖', '😣', '😞', '😓', '😥',
    '😤', '😠', '😡', '🤬', '👍', '👎', '👏', '🙌', '🙏', '💪',
    '🤝', '👋', '✌️', '🤞', '👌', '🤙', '👀', '❤️', '🧡', '💛',
    '💚', '💙', '💜', '🖤', '🤍', '💕', '💯', '🔥', '✨', '🎉',
    '🎊', '⭐', '✅', '❌', '📚', '📖', '☕', '🐱', '🐶', '🐻',
];

function formatMessageTime(createdAt) {
    const millis = toMillis(createdAt);
    if (!millis) return '';
    return new Date(millis).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}

export default function ChatConversation({chat, messages, loading, currentUserId}) {
    const navigate = useNavigate();
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [emojiPickerPos, setEmojiPickerPos] = useState(null);
    const messagesEndRef = useRef(null);
    const emojiBtnRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const inputRef = useRef(null);
    const [otherUser, setOtherUser] = useState(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!showEmojiPicker) return;

        function updatePosition() {
            const rect = emojiBtnRef.current?.getBoundingClientRect();
            if (rect) setEmojiPickerPos({bottom: window.innerHeight - rect.top + 8, left: rect.left});
        }

        updatePosition();
        window.addEventListener('resize', updatePosition);

        function handleClickOutside(e) {
            if (
                emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)
                && emojiBtnRef.current && !emojiBtnRef.current.contains(e.target)
            ) {
                setShowEmojiPicker(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('resize', updatePosition);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]);

    const otherUserId = chat.participants?.find(p => p !== currentUserId);

    useEffect(() => {
        const otherId = chat.participants?.find(p => p !== currentUserId);
        if (otherId) {
            UsersService.fetchUserProfile(otherId)
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

    function handleEmojiSelect(emoji) {
        setText(prev => prev + emoji);
        inputRef.current?.focus();
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
                <div className={styles.emojiWrap}>
                    <button
                        ref={emojiBtnRef}
                        type="button"
                        className={styles.emojiBtn}
                        onClick={() => setShowEmojiPicker(v => !v)}
                        aria-label="Insert emoji"
                    >
                        <Smile size={20}/>
                    </button>
                    {showEmojiPicker && emojiPickerPos && createPortal(
                        <div
                            ref={emojiPickerRef}
                            className={styles.emojiPicker}
                            style={{bottom: emojiPickerPos.bottom, left: emojiPickerPos.left}}
                        >
                            {EMOJI_OPTIONS.map((emoji, i) => (
                                <button
                                    key={`${emoji}-${i}`}
                                    type="button"
                                    className={styles.emojiOption}
                                    onClick={() => handleEmojiSelect(emoji)}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>,
                        document.getElementById('modal-root') ?? document.body,
                    )}
                </div>
                <input
                    ref={inputRef}
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
