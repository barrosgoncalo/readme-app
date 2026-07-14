import React from 'react';
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
    const isGiving = status === 'giving';
    const dir = isGiving ? DIRECTION.giving : DIRECTION.receiving;
    const name = otherUser?.name || 'Swapper';
    const initials = name.trim().slice(0, 2).toUpperCase();

    return (
        <View style={{ position: 'relative' }}>
            <View style={[styles.avatarChip, { borderColor: theme.headerBackground }]}>
                {otherUser?.avatarUrl ? (
                    <Image
                        source={{ uri: otherUser.avatarUrl }}
                        style={{ width: '100%', height: '100%' }}
                    />
                ) : (
                    <View style={{
                        width: '100%', height: '100%',
                        backgroundColor: dir.color,
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>
                            {initials}
                        </Text>
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
