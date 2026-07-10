import React from 'react';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Keyboard } from 'react-native';

/**
 * Shared map + marker rendering for location-picking screens
 * (StepTwoOfferScreen, SelectSwapLocationScreen).
 *
 * Handles three marker layers:
 *  - originalLocation (optional — only used by counter-offer flow)
 *  - sellerLocations (predefined pins, hidden while proposing an alternative)
 *  - customLocation (the draggable pin shown while isProposingAlternative)
 */
export default function LocationPickerMap({
    mapRef,
    theme,
    style,
    initialRegion,
    onMapReady,
    onRegionChangeComplete,
    isProposingAlternative,
    onMapPress,          // (coords) => void — reverse-geocode on tap
    onMarkerDragEnd,      // (coords) => void — reverse-geocode on drag end
    sellerLocations = [],
    selectedLocation,
    onSelectLocation,
    originalLocation = null,
    customLocation,
}) {
    const selectedPinColor = theme.primary || "#E58A1F";

    return (
        <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={style}
            onMapReady={onMapReady}
            onRegionChangeComplete={onRegionChangeComplete}
            onPress={(e) => isProposingAlternative && onMapPress?.(e.nativeEvent.coordinate)}
            onPanDrag={Keyboard.dismiss}
            initialRegion={initialRegion}
        >
            {!isProposingAlternative && originalLocation?.latitude && (
                <Marker
                    key="original-offer-location"
                    coordinate={{
                        latitude: Number(originalLocation.latitude),
                        longitude: Number(originalLocation.longitude),
                    }}
                    pinColor={selectedLocation?.id === originalLocation.id ? selectedPinColor : "#4A90E2"}
                    onPress={() => onSelectLocation(originalLocation)}
                />
            )}

            {!isProposingAlternative && sellerLocations.map((loc) => {
                if (originalLocation && loc.id === originalLocation.id) return null;

                return (
                    <Marker
                        key={loc.id}
                        coordinate={{
                            latitude: Number(loc.latitude),
                            longitude: Number(loc.longitude),
                        }}
                        pinColor={selectedLocation?.id === loc.id ? selectedPinColor : "#A35C37"}
                        onPress={() => onSelectLocation(loc)}
                    />
                );
            })}

            {isProposingAlternative && customLocation && (
                <Marker
                    draggable
                    coordinate={customLocation}
                    pinColor="#E53E3E"
                    onMarkerDragEnd={(e) => onMarkerDragEnd?.(e.nativeEvent.coordinate)}
                />
            )}
        </MapView>
    );
}
