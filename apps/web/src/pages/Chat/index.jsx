import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatService } from '@readme/shared/src/services/chat';
import { getUsersByIds } from '@readme/shared/src/services/users';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import Spinner from '../../components/Spinner.jsx';
import ChatList from './components/ChatList.jsx';
import ChatConversation from './components/ChatConversation.jsx';
import styles from './Chat.module.css';

export default function Chat() {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;
    const [searchParams, setSearchParams] = useSearchParams();

    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(searchParams.get('c') || null);
    const [messages, setMessages] = useState([]);
    const [userDetails, setUserDetails] = useState({});
    const [loading, setLoading] = useState(true);
    const [messageLoading, setMessageLoading] = useState(false);

    let unsubChats = null;
    let unsubMessages = null;

    useEffect(() => {
        if (!uid) return;

        setLoading(true);
        unsubChats = ChatService.streamUserChats(uid, setChats, (err) => {
            console.error('Error loading chats:', err);
            setLoading(false);
        });

        return () => {
            if (unsubChats) unsubChats();
        };
    }, [uid]);

    useEffect(() => {
        setLoading(false);
    }, [chats]);

    useEffect(() => {
        if (!activeChatId) {
            setMessages([]);
            return;
        }

        setMessageLoading(true);
        unsubMessages = ChatService.streamMessages(activeChatId, (msgs) => {
            setMessages(msgs);
            setMessageLoading(false);

            // Resolve participant names
            const otherUids = new Set();
            chats.forEach(c => {
                c.participants?.forEach(p => {
                    if (p !== uid) otherUids.add(p);
                });
            });

            if (otherUids.size > 0) {
                getUsersByIds(Array.from(otherUids))
                    .then(users => setUserDetails(users))
                    .catch(err => console.error('Error loading users:', err));
            }
        }, (err) => {
            console.error('Error loading messages:', err);
            setMessageLoading(false);
        });

        return () => {
            if (unsubMessages) unsubMessages();
        };
    }, [activeChatId, chats, uid]);

    if (loading) return <Spinner center label="Loading chats" />;

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
                userDetails={userDetails}
            />

            {activeChatId && activeChat ? (
                <ChatConversation
                    chat={activeChat}
                    messages={messages}
                    loading={messageLoading}
                    userDetails={userDetails}
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
