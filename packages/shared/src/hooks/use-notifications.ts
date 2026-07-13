import { useState, useEffect } from 'react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { DB } from '@readme/shared/src/services/DB';

export interface Notification {
    id: string;
    type: 'FOLLOW_REQUEST' | 'NEW_FOLLOW' | string;
    actorId: string;
    actorName: string;
    targetId: string;
    message: string;
    isRead: boolean;
    createdAt?: any;
}

export const useNotifications = () => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!currentUser) return;

        const path = `users/${currentUser.uid}/notifications`;

        const unsubscribe = DB.subscribeAdvanced(
            path,
            [],
            { field: 'createdAt', direction: 'desc' },
            50,
            (data: any) => {
                setNotifications(data as Notification[]);
                setLoading(false);
            },
            (error: Error) => {
                console.error("Error streaming notifications via DB layer:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    const markAsRead = async (notificationId: string): Promise<void> => {
        if (!currentUser) return;
        try {
            await DB.update(`users/${currentUser.uid}/notifications`, notificationId, { isRead: true });
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const deleteNotification = async (notificationId: string): Promise<void> => {
        if (!currentUser) return;
        try {
            await DB.remove(`users/${currentUser.uid}/notifications`, notificationId);
        } catch (error) {
            console.error("Failed to delete notification:", error);
        }
    };

    return { notifications, loading, markAsRead, deleteNotification };
};
