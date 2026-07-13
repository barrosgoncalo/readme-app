import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { UsersService } from '@readme/shared/src/services/users';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { Iconify } from 'react-native-iconify';
import { useNotifications } from '@readme/shared/src/hooks/use-notifications';
import NotificationItem from '../../../components/ui/NotificationItem';

export default function NotificationsScreen({ navigation }) {
    const theme = useTheme();
    const { currentUser } = useAuth();
    const { notifications, loading, markAsRead, deleteNotification } = useNotifications();

    const handleAcceptRequest = async (requesterUid, notificationId) => {
        try {
            await UsersService.acceptFollowRequest(currentUser.uid, requesterUid);
            // Once accepted, delete the notification so it leaves the feed
            await deleteNotification(notificationId);
        } catch (error) {
            console.error("Error accepting request:", error);
        }
    };

    const handleDeclineRequest = async (requesterUid, notificationId) => {
        try {
            await UsersService.declineFollowRequest(currentUser.uid, requesterUid);
            // Delete notification on decline
            await deleteNotification(notificationId);
        } catch (error) {
            console.error("Error declining request:", error);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.background, padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 40 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15 }}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text }}>Notifications</Text>
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 100 }}>
                        <Iconify icon="lucide:bell-off" size={48} color={theme.textMuted} style={{ marginBottom: 16 }} />
                        <Text style={{ color: theme.textMuted, fontSize: 16 }}>
                            You're all caught up!
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <NotificationItem 
                        item={item} 
                        theme={theme}
                        onAccept={handleAcceptRequest}
                        onDecline={handleDeclineRequest}
                        onDismiss={markAsRead}
                    />
                )}
            />
        </View>
    );
}
