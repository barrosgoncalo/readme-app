import { useEffect } from 'react';

export function useFitMarkers({
    mapRef,
    mapReady,
    loading,
    locations = [],
    isProposingAlternative,
    originalLocation = null,
}) {
    useEffect(() => {
        if (!mapReady || loading || isProposingAlternative || !mapRef.current) return;

        const coordsToFrame = [];
        const seenIds = new Set();

        if (originalLocation?.latitude && originalLocation?.longitude) {
            coordsToFrame.push({
                latitude: Number(originalLocation.latitude),
                longitude: Number(originalLocation.longitude),
            });
            if (originalLocation.id) seenIds.add(originalLocation.id);
        }

        locations.forEach(loc => {
            if (loc.id && seenIds.has(loc.id)) return;
            if (loc.latitude && loc.longitude) {
                coordsToFrame.push({
                    latitude: Number(loc.latitude),
                    longitude: Number(loc.longitude),
                });
            }
        });

        if (coordsToFrame.length === 0) return;

        console.log('[FIT DEBUG] coordsToFrame:', coordsToFrame);
        const timeoutId = setTimeout(() => {
            if (coordsToFrame.length === 1) {
                mapRef.current?.animateToRegion({
                    ...coordsToFrame[0],
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }, 300);
            } else {
                mapRef.current?.fitToCoordinates(coordsToFrame, {
                    edgePadding: { top: 60, right: 60, bottom: 220, left: 60 },
                    animated: true,
                });
            }
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [mapReady, loading, locations, isProposingAlternative, originalLocation]);
}
