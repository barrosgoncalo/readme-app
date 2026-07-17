// Web port of packages/shared/src/hooks/use-location-proposal.ts.
// That hook imports react-native's Keyboard, which doesn't exist on web —
// this is a behavioral port with the same state shape/actions, using web
// reverse-geocoding instead of expo-location (mobile's hook is left
// untouched).
import { useState } from 'react';
import { reverseGeocode } from '../utils/geocoding';

const DEFAULT_MAP_VIEWPORT = { latitude: 38.7223, longitude: -9.1393 };

export function useLocationProposal() {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isProposingAlternative, setIsProposingAlternative] = useState(false);
    const [customLocation, setCustomLocation] = useState(null);
    const [geocodingCustom, setGeocodingCustom] = useState(false);
    const [currentRegion, setCurrentRegion] = useState(DEFAULT_MAP_VIEWPORT);

    const handleReverseGeocode = async (coords) => {
        setGeocodingCustom(true);
        let address = 'Unknown location';
        try {
            const result = await reverseGeocode(coords.latitude, coords.longitude);
            if (result?.address) address = result.address;
        } catch (err) {
            // Network/geocoding failure — still place the pin using the raw
            // coordinates so the user is never stuck with a disabled Send
            // button and no way to recover (no address lookup succeeding
            // shouldn't block picking a location at all).
            console.warn('[Reverse Geocoding Layer Exception]', err);
        } finally {
            setCustomLocation({
                id: 'proposed_custom',
                title: 'Proposed Custom Location',
                address,
                latitude: coords.latitude,
                longitude: coords.longitude,
            });
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
    };

    const activeLocationSelection = isProposingAlternative ? customLocation : selectedLocation;
    const canSend = isProposingAlternative ? (!!customLocation && !geocodingCustom) : !!selectedLocation;

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
        handleCancelAlternative,
    };
}
