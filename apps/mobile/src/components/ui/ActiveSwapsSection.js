import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SwapCard } from '../../components/ui/SwapCard';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { ChatService } from '@readme/shared/src/services/chat';

export const ActiveSwapsSection = React.memo(({ currentUserId, navigation, styles, colorScheme }) => {
    const [activeChats, setActiveChats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUserId) {
            setActiveChats([]);
            setLoading(false);
            return;
        }

        const unsubscribe = ChatService.subscribeToActiveChats(
            currentUserId,
            (fetchedChats) => {
                setActiveChats(fetchedChats);
                setLoading(false);
            },
            (error) => {
                console.error("Subscription error:", error);
                setLoading(false);
            }
        );
        return unsubscribe;

    }, [currentUserId]);

    if (loading || activeChats.length === 0) return null;

    return (
        <View style={styles.swapSectionContainer}> 
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.swapList}
            >
                {activeChats.map((chat) => (
                    <TouchableOpacity 
                        key={chat.id}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate(ROUTES.CHAT_ROOM, {
                            chatId: chat.id,
                            targetSeller: chat.targetSeller
                        })}
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: colorScheme === 'dark' ? 0.32 : 0.12,
                            shadowRadius: 4.5,
                            elevation: 5,
                        }}
                    >
                        <SwapCard imageUrl={chat.imageUrl} status={chat.status} styles={styles} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
});
