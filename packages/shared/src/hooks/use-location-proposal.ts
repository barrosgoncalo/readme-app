import { useState, useEffect } from 'react';
import { Keyboard } from 'react-native';

import { LocationService } from '../services/location';

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

    const handleReverseGeocode = async (coords) => {
        setGeocodingCustom(true);
        try {
            const address = await LocationService.reverseGeocodeCoordinates(coords);
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
