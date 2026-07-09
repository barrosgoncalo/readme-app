import React, { useState, useRef, useEffect } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, 
    ActivityIndicator, useColorScheme, Keyboard 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Iconify } from 'react-native-iconify';
import { Colors } from '@readme/shared/src/constants/theme';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { ChatService } from '@readme/shared/src/services/chat';

// Map Architectures
import { useSellerLocations } from '@readme/shared/src/hooks/user-seller-locations';
import { useLocationProposal } from '@readme/shared/src/hooks/use-location-proposal';
import { useFitMarkers } from '@readme/shared/src/hooks/use-fit-markers';
import MapSearchBar from '../../../components/ui/MapSearchBar';
import SelectedLocationCard from '../../../components/ui/SelectedLocationCard';
import OfferBottomDock from '../../../components/ui/OfferBottomDock';

const LISBON_REGION = {
    latitude: 38.7223,
    longitude: -9.1393,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
};

export default function SelectSwapLocationScreen({ route, navigation }) {
    const { messageId, chatId, offerDetails, targetSellerUid, selectedBookId, selectedBookImage } = route.params;
    const { currentUser } = useAuth();
    
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

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
            navigation.pop(2); 
        } catch (error) {
            console.error("Failed to send counter:", error);
            setIsSubmitting(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.borderLight }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.textItemTitle }]}>Step 2: Location</Text>
                <View style={{ width: 32 }} />
            </SafeAreaView>

            <View style={styles.mapContainer}>
                {mapLoading ? (
                    <View style={styles.centerContent}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : (
                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_DEFAULT}
                        style={styles.map}
                        onMapReady={() => setMapReady(true)} // ✅ FIXED: Only flips the switch, avoiding overlapping function triggers
                        onRegionChangeComplete={setCurrentRegion}
                        onPress={(e) => isProposingAlternative && handleReverseGeocode(e.nativeEvent.coordinate)}
                        onPanDrag={Keyboard.dismiss}
                        initialRegion={defaultRegion} 
                    >
                        {!isProposingAlternative && originalLocation?.latitude && (
                            <Marker
                                key="original-offer-location"
                                coordinate={{
                                    latitude: Number(originalLocation.latitude),
                                    longitude: Number(originalLocation.longitude)
                                }}
                                pinColor={selectedLocation?.id === originalLocation.id ? theme.primary : "#4A90E2"}
                                onPress={() => setSelectedLocation(originalLocation)}
                            />
                        )}

                        {!isProposingAlternative && sellerLocations.map((loc) => {
                            if (loc.id === originalLocation?.id) return null; 

                            return (
                                <Marker
                                    key={loc.id}
                                    coordinate={{
                                        latitude: Number(loc.latitude),
                                        longitude: Number(loc.longitude)
                                    }}
                                    pinColor={selectedLocation?.id === loc.id ? theme.primary : "#A35C37"}
                                    onPress={() => setSelectedLocation(loc)}
                                />
                            );
                        })}

                        {isProposingAlternative && customLocation && (
                            <Marker
                                draggable
                                coordinate={customLocation}
                                pinColor="#E53E3E" 
                                onMarkerDragEnd={(e) => handleReverseGeocode(e.nativeEvent.coordinate)}
                            />
                        )}
                    </MapView>
                )}

                {/* Overlays */}
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, zIndex: 10 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    backButton: { padding: 4 },
    mapContainer: { flex: 1, position: 'relative' },
    map: { width: '100%', height: '100%' },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
