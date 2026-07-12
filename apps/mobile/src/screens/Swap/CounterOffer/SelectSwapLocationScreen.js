import React, { useState, useRef } from 'react';
import {
    View, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { ChatService } from '@readme/shared/src/services/chat';

// Map Architectures
import { useSellerLocations } from '@readme/shared/src/hooks/use-seller-locations';
import { useLocationProposal } from '@readme/shared/src/hooks/use-location-proposal';
import { useFitMarkers } from '@readme/shared/src/hooks/use-fit-markers';
import { useCounterOffer } from '@readme/shared/src/contexts/CounterOfferContext';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import LocationPickerMap from '../../../components/ui/LocationPickerMap';
import MapSearchBar from '../../../components/ui/MapSearchBar';
import SelectedLocationCard from '../../../components/ui/SelectedLocationCard';
import OfferBottomDock from '../../../components/ui/OfferBottomDock';

const LISBON_REGION = {
    latitude: 38.7223,
    longitude: -9.1393,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
};

export default function SelectSwapLocationScreen({ navigation }) {
    const { counterDraft, clearCounterOffer } = useCounterOffer();
    const { 
        messageId, 
        chatId, 
        offerDetails, 
        targetSellerUid, 
        selectedBookId, 
        selectedBookImage 
    } = counterDraft;

    const { currentUser } = useAuth();
    const theme = useTheme();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    
    const mapRef = useRef(null);
    const { sellerLocations, loading: mapLoading } = useSellerLocations(targetSellerUid || '');

    const originalLocation = offerDetails?.location;

    const {
        selectedLocation,
        setSelectedLocation,
        isProposingAlternative,
        customLocation,
        geocodingCustom,
        currentRegion,
        setCurrentRegion,
        activeLocationSelection,
        canSend: locationIsValid,
        handleReverseGeocode,
        handleStartProposingAlternative,
        handleCancelAlternative
    } = useLocationProposal(sellerLocations, mapRef);

    const defaultRegion = originalLocation?.latitude ? {
        latitude: Number(originalLocation.latitude),
        longitude: Number(originalLocation.longitude),
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    } : LISBON_REGION;

    useFitMarkers({
        mapRef,
        mapReady,
        loading: mapLoading,
        locations: sellerLocations,
        isProposingAlternative,
        originalLocation,
    });

    const handleSendCounter = async () => {
        if (isSubmitting || !locationIsValid || !currentUser?.uid) return;

        setIsSubmitting(true);
        try {
            const updatedOfferDetails = {
                ...offerDetails,
                location: activeLocationSelection
            };
            
            await ChatService.sendCounterOffer(
                chatId,
                messageId,
                currentUser.uid,
                updatedOfferDetails,
                activeLocationSelection,
                selectedBookId,
                selectedBookImage
            );
            
            clearCounterOffer();
            navigation.pop(2);
        } catch (error) {
            console.error("Failed to send counter:", error);
            setIsSubmitting(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScreenHeader
                title="Step 2: Location"
                onBack={() => navigation.goBack()}
                theme={theme}
                borderBottom
            />

            <View style={styles.mapContainer}>
                {mapLoading ? (
                    <View style={styles.centerContent}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : (
                    <LocationPickerMap
                        mapRef={mapRef}
                        theme={theme}
                        style={styles.map}
                        initialRegion={defaultRegion}
                        onMapReady={() => setMapReady(true)}
                        onRegionChangeComplete={setCurrentRegion}
                        isProposingAlternative={isProposingAlternative}
                        onMapPress={handleReverseGeocode}
                        onMarkerDragEnd={handleReverseGeocode}
                        sellerLocations={sellerLocations}
                        selectedLocation={selectedLocation}
                        onSelectLocation={setSelectedLocation}
                        originalLocation={originalLocation}
                        customLocation={customLocation}
                    />
                )}

                {isProposingAlternative && (
                    <MapSearchBar theme={theme} mapRef={mapRef} onLocationFound={handleReverseGeocode} />
                )}

                {!mapLoading && activeLocationSelection && (
                    <SelectedLocationCard
                        theme={theme}
                        location={activeLocationSelection}
                        isLoading={geocodingCustom}
                        isAlternative={isProposingAlternative}
                        onClose={() => isProposingAlternative ? handleCancelAlternative() : setSelectedLocation(null)}
                    />
                )}
            </View>

            <OfferBottomDock
                theme={theme}
                canSend={locationIsValid && !isSubmitting}
                loading={mapLoading || isSubmitting}
                isProposingAlternative={isProposingAlternative}
                onSend={handleSendCounter}
                onToggleAlternative={isProposingAlternative ? handleCancelAlternative : handleStartProposingAlternative}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    mapContainer: { flex: 1, position: 'relative' },
    map: { width: '100%', height: '100%' },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
