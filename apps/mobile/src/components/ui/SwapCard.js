import React, { useState, useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { Iconify } from 'react-native-iconify';

const DIRECTION = {
    giving: {
        icon: 'lucide:send',
        color: '#0F6E56',
        actionText: 'Offer sent to',
    },
    receiving: {
        icon: 'lucide:inbox',
        color: '#993C1D',
        actionText: 'Offer from',
    },
};

export const SwapCard = ({ imageUrl, status, otherUser, currentUserId, chat, styles, theme, colorScheme }) => {
    const [imageError, setImageError] = useState(false);

    // Reset error state if the otherUser or their avatarUrl changes
    useEffect(() => {
        setImageError(false);
    }, [otherUser?.avatarUrl]);

    const isGiving = status === 'giving';
    const dir = isGiving ? DIRECTION.giving : DIRECTION.receiving;

    // Detect if the user is deleted
    const isDeleted = !otherUser || Object.keys(otherUser).length === 0;
    const name = isDeleted ? 'Deleted User' : (otherUser?.name || 'Swapper');

    // Only attempt to show the avatar if we have a URL and it hasn't failed to load
    const showAvatar = otherUser?.avatarUrl && !imageError;

    return (
        <View style={{ position: 'relative' }}>
            <View style={[styles.avatarChip, { borderColor: theme.headerBackground, overflow: 'hidden' }]}>
                {showAvatar ? (
                    <Image
                        source={{ uri: otherUser.avatarUrl }}
                        style={{ width: '100%', height: '100%' }}
                        onError={() => setImageError(true)} // Intercept 404/403 errors
                    />
                ) : (
                    /* Universal User Icon Fallback */
                    <View style={{
                        width: '100%', height: '100%',
                        backgroundColor: isDeleted ? '#7F8C8D' : dir.color, // Gray for deleted, directional color for active
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Iconify icon="lucide:user" size={20} color="#FFFFFF" />
                    </View>
                )}
            </View>

            <View
                style={styles.swapCardWrapper}
                accessible
                accessibilityLabel={`${dir.actionText} ${name}`}
            >
                <View style={{ position: 'relative' }}>
                    <View style={styles.swapCardThumbnail}>
                        <Image
                            source={{ uri: imageUrl || 'https://via.placeholder.com/150' }}
                            style={styles.swapCardImage}
                        />
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: dir.color, borderColor: theme.headerBackground }]}>
                        <Iconify icon={dir.icon} size={12} color="#FFFFFF" />
                    </View>
                </View>

                {/* Split into two lines for a subtle, compact footprint */}
                <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                    <Text 
                        numberOfLines={1} 
                        style={{ fontSize: 12, fontWeight: '500', color: 'rgba(255, 255, 255, 0.7)', marginBottom: 2 }}
                    >
                        {dir.actionText}
                    </Text>
                    <Text 
                        numberOfLines={1} 
                        style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}
                    >
                        {name}
                    </Text>
                </View>
            </View>
        </View>
    );
};

