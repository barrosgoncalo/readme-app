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
            // Avoid pushing a duplicate coordinate for the same spot already added above
            if (loc.id && seenIds.has(loc.id)) return;
            if (loc.latitude && loc.longitude) {
                coordsToFrame.push({
                    latitude: Number(loc.latitude),
                    longitude: Number(loc.longitude),
                });
            }
        });

        if (coordsToFrame.length === 0) return;

        const timeoutId = setTimeout(() => {
            if (coordsToFrame.length === 1) {
                // fitToCoordinates doesn't zoom meaningfully with a single point;
                // animate to a sensible region around it instead.
                mapRef.current?.animateToRegion({
                    ...coordsToFrame[0],
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }, 300);
            } else {
                mapRef.current?.fitToCoordinates(coordsToFrame, {
                    // Optimized paddings to prevent markers from hitting screen thresholds on smaller devices
                    edgePadding: { top: 60, right: 60, bottom: 220, left: 60 },
                    animated: true,
                });
            }
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [mapReady, loading, locations, isProposingAlternative, originalLocation]);
}
