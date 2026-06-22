import React from 'react';
import { View, Image } from 'react-native';
import { Iconify } from 'react-native-iconify';

export const SwapCard = ({ imageUrl, status, styles }) => {
    const isGiving = status === 'giving';
    const badgeColor = isGiving ? '#4CD964' : '#FF3B30'; 
    const iconName = isGiving ? 'lucide:arrow-right' : 'lucide:arrow-left';

    return (
        <View style={[styles.swapCardWrapper, { overflow: 'visible' }]}>
            <Image source={{ uri: imageUrl }} style={styles.swapCardImage} />
            
            {/* Adicionei o borderColor aqui inline para garantir que a borda fica branca */}
            <View style={[styles.statusBadge, { backgroundColor: badgeColor, borderColor: '#FFFFFF' }]}>
                <Iconify icon={iconName} size={14} color="#FFFFFF" />
            </View>
        </View>
    );
};
