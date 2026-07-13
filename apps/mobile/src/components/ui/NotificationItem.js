import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Iconify } from 'react-native-iconify';

export default function NotificationItem({ item, theme, onAccept, onDecline, onDismiss }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const isUnread = !item.isRead;

    const handleAccept = async () => {
        setIsProcessing(true);
        await onAccept(item.actorId, item.id);
        setIsProcessing(false);
    };

    const handleDecline = async () => {
        setIsProcessing(true);
        await onDecline(item.actorId, item.id);
        setIsProcessing(false);
    };

    return (
        <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginBottom: 16, 
            padding: 12,
            backgroundColor: isUnread ? theme.cardBackground : 'transparent',
            borderRadius: 12,
            borderWidth: isUnread ? 1 : 0,
            borderColor: theme.border
        }}>
            {/* Avatar / Icon Placeholder */}
            <View style={{ width: 50, height: 50, borderRadius: 25, marginRight: 15, backgroundColor: theme.border, justifyContent: 'center', alignItems: 'center' }}>
                <Iconify icon={item.type === 'FOLLOW_REQUEST' ? "lucide:user-plus" : "lucide:bell"} size={24} color={theme.textMuted} />
            </View>

            {/* Notification Content */}
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, color: theme.text, fontWeight: isUnread ? 'bold' : 'normal' }}>
                    {item.message}
                </Text>

                {/* Conditional UI: Follow Request Actions */}
                {item.type === 'FOLLOW_REQUEST' && (
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                        {isProcessing ? (
                            <ActivityIndicator size="small" color={theme.primary} />
                        ) : (
                            <>
                                <TouchableOpacity 
                                    onPress={handleAccept}
                                    style={{ backgroundColor: theme.primary, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8 }}
                                >
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>Accept</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={handleDecline}
                                    style={{ backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8 }}
                                >
                                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 13 }}>Decline</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}
            </View>

            {/* Dismiss / Mark Read Button for standard notifications */}
            {item.type !== 'FOLLOW_REQUEST' && isUnread && (
                <TouchableOpacity onPress={() => onDismiss(item.id)} style={{ padding: 8 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.primary }} />
                </TouchableOpacity>
            )}
        </View>
    );
}
