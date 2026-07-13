import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Iconify } from 'react-native-iconify';

export default function NotificationItem({ item, theme, onAccept, onDecline }) {
    if (!item) return null;

    const [isProcessing, setIsProcessing] = useState(false);

    const handleAccept = async () => {
        setIsProcessing(true);
        await onAccept(item.actorId || item.requesterUid, item.id);
        setIsProcessing(false);
    };

    const handleDecline = async () => {
        setIsProcessing(true);
        await onDecline(item.actorId || item.requesterUid, item.id);
        setIsProcessing(false);
    };

    // Look for a photo URL in the notification document (adjust the property name if yours is different!)
    const avatarUrl = item.actorPhotoURL || item.requesterPhotoURL || item.photoURL;

    return (
        <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginBottom: 16, 
            padding: 12,
            backgroundColor: theme.cardBackground || '#1C1C1E',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border || '#333'
        }}>
            {/* Avatar / Icon */}
            {avatarUrl ? (
                <Image 
                    source={{ uri: avatarUrl }} 
                    style={{ width: 50, height: 50, borderRadius: 25, marginRight: 15, backgroundColor: theme.border || '#333' }} 
                />
            ) : (
                <View style={{ width: 50, height: 50, borderRadius: 25, marginRight: 15, backgroundColor: theme.border || '#333', justifyContent: 'center', alignItems: 'center' }}>
                    <Iconify icon={item.type === 'FOLLOW_REQUEST' ? "lucide:user-plus" : "lucide:bell"} size={24} color={theme.textMuted} />
                </View>
            )}

            {/* Notification Content */}
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, color: theme.text, fontWeight: '500' }}>
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
        </View>
    );
}
