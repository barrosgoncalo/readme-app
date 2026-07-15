import React from 'react'; 
import { View } from 'react-native';
import { Iconify } from 'react-native-iconify';

export const GranularRating = ({ rating, theme, size = 14 }) => {
    const starSize = size;
    const starSpacing = Math.round(size * 0.15); 
    const totalStars = 5;

    const fillPercentage = Math.max(0, Math.min(totalStars, rating)) / totalStars;
    const containerWidth = (starSize * totalStars) + (starSpacing * (totalStars - 1));

    const renderStars = (icon, color) =>
        Array.from({ length: totalStars }, (_, i) => (
            <Iconify
                key={i}
                icon={icon}
                size={starSize}
                color={color}
                style={{ marginRight: i < totalStars - 1 ? starSpacing : 0 }}
            />
        ));

    return (
        <View style={{ width: containerWidth, height: starSize, position: 'relative' }}>
            {/* Background Layer: empty outlines */}
            <View style={{ flexDirection: 'row', position: 'absolute', top: 0, left: 0 }}>
                {renderStars("ph:star", theme.textMuted || '#A0A0A0')}
            </View>

            {/* Foreground Layer: filled shapes, clipped by precision width mask */}
            <View
                style={{
                    flexDirection: 'row',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${fillPercentage * 100}%`,
                    overflow: 'hidden',
                }}
            >
                <View style={{ flexDirection: 'row', width: containerWidth }}>
                    {renderStars("ph:star-fill", theme.secondary || '#E58A1F')}
                </View>
            </View>
        </View>
    );
};
