import React from 'react';
import { View } from 'react-native';
import { Iconify } from 'react-native-iconify';
import { Image } from 'expo-image';

export const SwapCard = ({ imageUrl, status, styles }) => {
    const isGiving = status === 'giving';
    const badgeColor = isGiving ? '#4CD964' : '#FF3B30'; 
    const iconName = isGiving ? 'lucide:arrow-right' : 'lucide:arrow-left';

    return (
        <View 
            style={[
                styles.swapCardWrapper, 
                { 
                    width: 100,          // Forces explicit width
                    height: 150,         // Forces explicit height
                    marginRight: 16,     // 👈 FORCES THE GAP BETWEEN CARDS
                    overflow: 'visible', // Ensures the badge can still pop out
                    position: 'relative' 
                }
            ]}
        >
            <Image 
                source={{ uri: imageUrl }}
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    borderRadius: 12,    // 👈 FORCES THE IMAGE CORNERS TO ROUND
                }}
                contentFit="cover"
            />
            
            {/* Badge positions absolutely relative to the forced 100x150 container */}
            <View 
                style={[
                    styles.statusBadge, 
                    { 
                        backgroundColor: badgeColor, 
                        borderColor: '#FFFFFF',
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        zIndex: 10 
                    }
                ]}
            >
                <Iconify icon={iconName} size={14} color="#FFFFFF" />
            </View>
        </View>
    );
};
