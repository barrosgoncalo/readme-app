import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {useNavigate} from 'react-router-dom';
import {Send, Smile, Flag, Info, Ban} from 'lucide-react';
import {ChatService} from '@readme/shared/src/services/chat';
import {ReportsService} from '@readme/shared/src/services/reports';
import {REPORT_TARGET_TYPE} from '@readme/shared/src/constants/status';
import {toMillis} from '@readme/shared/src/utils/timestamp';
import Spinner from '../../../components/Spinner.jsx';
import ReportModal from '../../../components/ReportModal.jsx';
import {WEB_ROUTES} from '../../../constants/webRoutes';
import {useToast} from '../../../contexts/ToastContext.jsx';
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
    const [showReportModal, setShowReportModal] = useState(false);
    const [, showToast] = useToast(3000);

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

    const otherUserId = chat.targetSeller?.uid;
    const displayName = chat.targetSeller?.name || 'Chat';
    const avatarUrl = chat.targetSeller?.avatarUrl;

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

    async function handleSubmitReport(reason) {
        if (!otherUserId) return;
        try {
            const snapshot = ReportsService.buildChatSnapshot(messages, {
                name: displayName,
                avatarUrl,
            });
            await ReportsService.submitReport(currentUserId, REPORT_TARGET_TYPE.CHAT, chat.id, otherUserId, reason, snapshot);
            showToast('Thanks — our team will review this conversation.');
        } catch (err) {
            showToast("We couldn't submit your report. Please try again.");
            console.error(err);
        }
    }

    return (
        <div className={styles.conversation}>
            <ReportModal
                open={showReportModal}
                onClose={() => setShowReportModal(false)}
                onSubmit={handleSubmitReport}
                title="Report this conversation"
            />

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="" className={styles.avatar}/>
                    ) : (
                        <span className={styles.avatarPlaceholder} aria-hidden>
                            {displayName.charAt(0).toUpperCase()}
                        </span>
                    )}
                    <div>
                        <h2
                            className={styles.name}
                            onClick={() => otherUserId && navigate(WEB_ROUTES.userProfile(otherUserId))}
                        >
                            {displayName}
                        </h2>
                    </div>
                </div>
                <button
                    type="button"
                    className={styles.reportBtn}
                    onClick={() => setShowReportModal(true)}
                    aria-label="Report conversation"
                    title="Report conversation"
                >
                    <Flag size={18}/>
                </button>
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
                                    <>
                                        <OfferMessage
                                            message={msg}
                                            isOwn={msg.senderId === currentUserId}
                                            currentUserId={currentUserId}
                                            chatId={chat.id}
                                            otherUserId={otherUserId}
                                        />

                                        {/* Nova mensagem de sistema injetada logo após a oferta cancelada */}
                                        {msg.offerDetails?.status === 'unavailable' && (
                                            <div className={styles.systemMessage}>
                                                <Info size={16}/>
                                                <span>
                                        The book associated with this trade has been removed.
                                        This trade was automatically cancelled.
                                    </span>
                                            </div>
                                        )}
                                    </>
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

            {/* Composer ou Aviso de Desativado */}
            {chat.disabled ? (
                <div className={styles.systemMessage} style={{ margin: 'var(--space-3) auto', padding: '12px 20px', maxWidth: '80%' }}>
                    <Ban size={18} color="var(--error)" />
                    <span style={{ color: 'var(--error)', fontWeight: '500' }}>
            {chat.disabledReason === 'banned'
                ? 'This user has been banned.'
                : 'This user has deleted their account.'}
        </span>
                </div>
            ) : (
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
            )}
        </div>
    );
}
