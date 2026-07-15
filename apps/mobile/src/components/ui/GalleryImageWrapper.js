import React from 'react';
import { Image } from 'expo-image';

/**
 * A wrapper for expo-image to be used with react-native-image-viewing.
 * It intercepts the onLoad event to pass the correct native event dimensions
 * that the image viewer library expects.
 */
export const GalleryImageWrapper = ({ source, style, onLoad, ...props }) => (
    <Image
        source={source}
        style={style}
        contentFit="contain"
        onLoad={(e) => {
            if (onLoad) {
                // Formatting the event payload to match what react-native-image-viewing needs
                onLoad({ nativeEvent: { source: { width: e.source.width, height: e.source.height } } });
            }
        }}
        {...props}
    />
);
