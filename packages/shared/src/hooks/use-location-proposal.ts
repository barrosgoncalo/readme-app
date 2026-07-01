import { useState, useEffect } from 'react';
import { Keyboard } from 'react-native';
import { reverseGeocodeCoordinates } from '../services/location';

const DEFAULT_MAP_VIEWPORT = { 
    latitude: 38.7223, 
    longitude: -9.1393, 
    latitudeDelta: 0.08, 
    longitudeDelta: 0.08 
};

export function useLocationProposal(sellerLocations, mapRef) {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isProposingAlternative, setIsProposingAlternative] = useState(false);
    const [customLocation, setCustomLocation] = useState(null);
    const [geocodingCustom, setGeocodingCustom] = useState(false);
    const [currentRegion, setCurrentRegion] = useState(DEFAULT_MAP_VIEWPORT);

    // Dynamic viewport side-effect management
    useEffect(() => {
        if (mapRef.current && sellerLocations.length > 0 && !isProposingAlternative) {
            const viewportTimer = setTimeout(() => {
                if (sellerLocations.length === 1) {
                    mapRef.current.animateToRegion({
                        latitude: sellerLocations[0].latitude,
                        longitude: sellerLocations[0].longitude,
                        latitudeDelta: 0.04, 
                        longitudeDelta: 0.04,
                    }, 1000); 
                } else {
                    mapRef.current.fitToCoordinates(sellerLocations, {
                        edgePadding: { top: 80, right: 80, bottom: 360, left: 80 },
                        animated: true,
                    });
                }
            }, 400);

            return () => clearTimeout(viewportTimer);
        }
    }, [sellerLocations, isProposingAlternative, mapRef]);

    const handleReverseGeocode = async (coords) => {
        setGeocodingCustom(true);
        try {
            const address = await reverseGeocodeCoordinates(coords);
            setCustomLocation({
                id: 'proposed_custom',
                title: 'Proposed Custom Location',
                address,
                latitude: coords.latitude,
                longitude: coords.longitude
            });
        } catch (error) {
            console.warn("[Reverse Geocoding Layer Exception]", error);
        } finally {
            setGeocodingCustom(false);
        }
    };

    const handleStartProposingAlternative = () => {
        setSelectedLocation(null);
        setIsProposingAlternative(true);
        handleReverseGeocode({ latitude: currentRegion.latitude, longitude: currentRegion.longitude });
    };

    const handleCancelAlternative = () => {
        setIsProposingAlternative(false);
        setCustomLocation(null);
        Keyboard.dismiss();
    };

    const activeLocationSelection = isProposingAlternative ? customLocation : selectedLocation;
    const canSend = isProposingAlternative ? (customLocation && !geocodingCustom) : !!selectedLocation;

    return {
        selectedLocation,
        setSelectedLocation,
        isProposingAlternative,
        customLocation,
        geocodingCustom,
        currentRegion,
        setCurrentRegion,
        activeLocationSelection,
        canSend,
        handleReverseGeocode,
        handleStartProposingAlternative,
        handleCancelAlternative
    };
}
