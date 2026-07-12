import {useEffect, useState} from 'react';
import {useSearchParams, useOutletContext} from 'react-router-dom';
import {ChatService} from '@readme/shared/src/services/chat';
import {useAuth} from '@readme/shared/src/contexts/AuthContext/web';
import Spinner from '../../components/Spinner.jsx';
import ChatList from './components/ChatList.jsx';
import ChatConversation from './components/ChatConversation.jsx';
import styles from './Chat.module.css';

export default function Chat() {
    const {currentUser} = useAuth();
    const uid = currentUser?.uid;
    const [searchParams, setSearchParams] = useSearchParams();
    const {isSidebarOpen} = useOutletContext() || {isSidebarOpen: false};

    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(searchParams.get('c') || null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [messageLoading, setMessageLoading] = useState(false);

    useEffect(() => {
        if (!uid) return;

        setLoading(true);
        const unsubChats = ChatService.streamUserChats(uid, (chats) => {
            setChats(chats);
            setLoading(false);
        }, (err) => {
            console.error('Error loading chats:', err);
            setLoading(false);
        });

        return () => unsubChats();
    }, [uid]);

    useEffect(() => {
        if (!activeChatId) {
            setMessages([]);
            return;
        }

        setMessageLoading(true);
        const unsubMessages = ChatService.streamMessages(activeChatId, (msgs) => {
            setMessages(msgs);
            setMessageLoading(false);
        }, (err) => {
            console.error('Error loading messages:', err);
            setMessageLoading(false);
        });

        return () => unsubMessages();
    }, [activeChatId]);

    if (loading) return <Spinner center label="Loading chats"/>;

    const activeChat = chats.find(c => c.id === activeChatId);

    return (
        <div className={styles.page}>
            <ChatList
                chats={chats}
                activeChatId={activeChatId}
                onSelectChat={(chatId) => {
                    setActiveChatId(chatId);
                    setSearchParams({c: chatId});
                }}
                isSidebarOpen={isSidebarOpen}
                currentUserId={uid}
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
