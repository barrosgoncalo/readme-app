import { useEffect, useState } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { ChatService } from '@readme/shared/src/services/chat';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { SkeletonList } from '../../components/Skeleton.jsx';
import ChatList from './components/ChatList.jsx';
import ChatConversation from './components/ChatConversation.jsx';
import styles from './Chat.module.css';

export default function Chat() {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;
    const [searchParams, setSearchParams] = useSearchParams();
    useOutletContext();

    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(searchParams.get('c') || null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [messageLoading, setMessageLoading] = useState(false);

    // 1. Fetching Inbox Chats
    useEffect(() => {
        if (!uid) return;

        setLoading(true);
        // Replaced streamUserChats with subscribeToActiveChats
        const unsubChats = ChatService.subscribeToActiveChats(
            uid,
            (fetchedChats) => {
                setChats(fetchedChats);
                setLoading(false);
            },
            (err) => {
                console.error('Error loading chats:', err);
                setLoading(false);
            }
        );

        return () => unsubChats();
    }, [uid]);

    // 2. Fetching Active Chat Messages
    useEffect(() => {
        // Ensure we have both the chat ID and the user ID before fetching
        if (!activeChatId || !uid) {
            setMessages([]);
            return;
        }

        setMessageLoading(true);
        // Replaced streamMessages with subscribeToMessagesOrdered
        // Note: subscribeToMessagesOrdered requires the currentUserId as the second argument
        const unsubMessages = ChatService.subscribeToMessagesOrdered(
            activeChatId,
            uid,
            (msgs) => {
                setMessages(msgs);
                setMessageLoading(false);
            },
            (err) => {
                console.error('Error loading messages:', err);
                setMessageLoading(false);
            }
        );

        return () => unsubMessages();
    }, [activeChatId, uid]);

    if (loading) return <SkeletonList count={5} />;

    const activeChat = chats.find(c => c.id === activeChatId);

    return (
        <div className={styles.page}>
            <ChatList
                chats={chats}
                activeChatId={activeChatId}
                onSelectChat={(chatId) => {
                    setActiveChatId(chatId);
                    setSearchParams({ c: chatId });
                }}
            />

            {activeChatId && activeChat ? (
                <ChatConversation
                    chat={activeChat}
                    messages={messages}
                    loading={messageLoading}
                    currentUserId={uid}
                />
            ) : (
                <div className={styles.emptyState}>
                    <p>Select a chat to start messaging</p>
                </div>
            )}
        </div>
    );
}
