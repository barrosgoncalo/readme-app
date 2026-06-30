import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, useColorScheme, ActivityIndicator, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Iconify } from 'react-native-iconify';
import { Colors } from '@readme/shared/src/constants/theme';
import * as Location from 'expo-location';

// Custom Hooks & Components 
import { useSellerLocations } from '@readme/shared/src/hooks/user-seller-locations';
import MapSearchBar from '../../../components/ui/MapSearchBar';
import SelectedLocationCard from '../../../components/ui/SelectedLocationCard';
import OfferBottomDock from '../../../components/ui/OfferBottomDock';

/**
 * StepTwoOfferScreen
 * Allows the user to select an exchange location for a book offer.
 * Users can either choose from the seller's predefined locations or 
 * propose a custom alternative location by tapping/dragging on the map.
 */
export default function StepTwoOfferScreen({ route, navigation }) {
    // --- Theme & Navigation Params ---
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { targetBook, offeredBooks = [] } = route.params;

    // --- Data Fetching ---
    // Custom hook to fetch and geocode the seller's institutional addresses
    const { sellerLocations, loading } = useSellerLocations(targetBook?.uid);

    // --- State Management ---
    // Tracks the predefined seller location the user has tapped on
    const [selectedLocation, setSelectedLocation] = useState(null);
    
    // Toggles the mode where the user can pick their own map spot
    const [isProposingAlternative, setIsProposingAlternative] = useState(false);
    
    // Stores the coordinate and address data for the user's custom dropped pin
    const [customLocation, setCustomLocation] = useState(null);
    
    // True while Expo is resolving coordinates into a readable street address
    const [geocodingCustom, setGeocodingCustom] = useState(false);
    
    // Controls what part of the world the map is currently showing. Defaults to Lisbon center.
    const [currentRegion, setCurrentRegion] = useState({ 
        latitude: 38.7223, 
        longitude: -9.1393, 
        latitudeDelta: 0.08, 
        longitudeDelta: 0.08 
    });

    const mapRef = useRef(null);

    // --- Lifecycle Effects ---
    // Automatically zooms and centers the map to fit all available seller markers once they load
    useEffect(() => {
        // Only fit to markers if we have them and the user isn't in custom proposal mode
        if (mapRef.current && sellerLocations.length > 0 && !isProposingAlternative) {
            setTimeout(() => {
                if (sellerLocations.length === 1) {
                    // Zoom closely if there's only one location
                    mapRef.current.animateToRegion({
                        latitude: sellerLocations[0].latitude,
                        longitude: sellerLocations[0].longitude,
                        latitudeDelta: 0.04, 
                        longitudeDelta: 0.04,
                    }, 1000); 
                } else {
                    // Fit all markers within view, leaving padding for the floating bottom UI
                    mapRef.current.fitToCoordinates(sellerLocations, {
                        edgePadding: { top: 80, right: 80, bottom: 360, left: 80 },
                        animated: true,
                    });
                }
            }, 400); // Slight delay ensures map view is fully mounted before animating
        }
    }, [sellerLocations, isProposingAlternative]);

    // --- Handlers ---
    
    /**
     * Converts raw map coordinates into a readable street address.
     * Used when the user taps the map or drags the custom marker.
     */
    const handleReverseGeocode = async (coords) => {
        setGeocodingCustom(true);
        try {
            const response = await Location.reverseGeocodeAsync(coords);
            const place = response[0];

            // Fallback address format just in case reverse geocoding yields limited data
            let address = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
            
            if (place) {
                // Construct a readable address string from the geocode result
                const street = place.street || place.name || "Custom Spot";
                address = `${street}${place.streetNumber ? ` ${place.streetNumber}` : ""}${place.district ? `, ${place.district}` : ""}${place.city ? `, ${place.city}` : ""}`;
            }

            // Update the custom location state to render the marker and bottom card
            setCustomLocation({
                id: 'proposed_custom',
                title: 'Proposed Custom Location',
                address,
                latitude: coords.latitude,
                longitude: coords.longitude
            });
        } catch (error) {
            console.warn("Reverse geocoding error:", error);
        } finally {
            setGeocodingCustom(false);
        }
    };

    /**
     * Enters alternative mode. Clears any selected predefined seller location
     * and drops a custom pin right in the center of the user's current screen.
     */
    const handleStartProposingAlternative = () => {
        setSelectedLocation(null);
        setIsProposingAlternative(true);
        handleReverseGeocode({ 
            latitude: currentRegion.latitude, 
            longitude: currentRegion.longitude 
        });
    };

    /**
     * Exits alternative mode, removing the custom pin and closing the keyboard.
     */
    const handleCancelAlternative = () => {
        setIsProposingAlternative(false);
        setCustomLocation(null);
        Keyboard.dismiss();
    };

    /**
     * Packages the selected data and moves the user forward in the flow.
     */
    const handleSendOffer = () => {
        // Determine which location to use based on the current mode
        const finalLocation = isProposingAlternative ? customLocation : selectedLocation;
        if (!finalLocation) return;

        const offeredTitles = offeredBooks.map(item => item.book?.title || item.title || 'Unknown Title').join(', ');

        // Placeholder confirmation alert (replace navigation.popToTop with your actual chat creation logic)
        Alert.alert(
            "Offer Ready to Send!",
            `Offering: ${offeredTitles}\nFor: ${targetBook.title}\nAt: ${finalLocation.title}\n(${finalLocation.address})`,
            [
                { text: "Send to Chat", onPress: () => navigation.popToTop() },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    // --- Derived Values for Rendering ---
    // Determines which location details to show in the floating card
    const activeLocationSelection = isProposingAlternative ? customLocation : selectedLocation;
    // Disables the 'Send' button if no location is finalized or if actively geocoding
    const canSend = isProposingAlternative ? (customLocation && !geocodingCustom) : !!selectedLocation;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>

            {/* --- Top Header Navigation --- */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.textItemTitle }]}>
                    {isProposingAlternative ? "Propose Custom Spot" : "Choose Exchange Location"}
                </Text> 
                {/* Empty view to balance the header layout */}
                <View style={{ width: 24 }}/>
            </SafeAreaView>

            {/* --- Main Map Area --- */}
            <View style={styles.mapContainer}>
                {loading ? (
                    // Loading State
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.primary || "#E58A1F"} />
                        <Text style={[styles.loadingText, { color: theme.subtext }]}>Finding spots...</Text>
                    </View>
                ) : (
                        // Loaded Map
                        <MapView
                            ref={mapRef}
                            provider={PROVIDER_DEFAULT}
                            style={styles.map}
                            onRegionChangeComplete={setCurrentRegion} // Keep track of camera position
                            // If in custom mode, tapping the map moves the custom pin
                            onPress={(e) => isProposingAlternative && handleReverseGeocode(e.nativeEvent.coordinate)}
                            onPanDrag={Keyboard.dismiss}
                            initialRegion={currentRegion}
                        >
                            {/* Render standard seller pins only if we aren't proposing an alternative */}
                            {!isProposingAlternative && sellerLocations.map((loc) => (
                                <Marker
                                    key={loc.id}
                                    coordinate={loc}
                                    title={loc.title}
                                    description={loc.address}
                                    // Highlight the currently selected pin
                                    pinColor={selectedLocation?.id === loc.id ? (theme.primary || "#E58A1F") : "#A35C37"}
                                    onPress={() => setSelectedLocation(loc)}
                                />
                            ))}

                            {/* Render the draggable custom pin if in alternative mode */}
                            {isProposingAlternative && customLocation && (
                                <Marker
                                    draggable
                                    coordinate={customLocation}
                                    title="Your Custom Proposal"
                                    description="Drag me or tap somewhere else!"
                                    pinColor="#E53E3E" 
                                    // Update address text when user drops the pin in a new spot
                                    onMarkerDragEnd={(e) => handleReverseGeocode(e.nativeEvent.coordinate)}
                                />
                            )}
                        </MapView>
                    )}

                {/* --- Floating Overlays --- */}

                {/* Search Bar (Only visible in Custom Location Mode) */}
                {isProposingAlternative && (
                    <MapSearchBar 
                        theme={theme} 
                        mapRef={mapRef} 
                        onLocationFound={handleReverseGeocode} 
                    />
                )}

                {/* Info Card showing details of the currently selected/placed pin */}
                {!loading && activeLocationSelection && (
                    <SelectedLocationCard 
                        theme={theme} 
                        location={activeLocationSelection} 
                        isLoading={geocodingCustom}
                        isAlternative={isProposingAlternative}
                        onClose={() => isProposingAlternative ? handleCancelAlternative() : setSelectedLocation(null)} 
                    />
                )}
            </View>

            {/* --- Fixed Bottom Actions --- */}
            <OfferBottomDock 
                theme={theme}
                canSend={canSend}
                loading={loading}
                isProposingAlternative={isProposingAlternative}
                onSend={handleSendOffer}
                onToggleAlternative={isProposingAlternative ? handleCancelAlternative : handleStartProposingAlternative}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, paddingTop: 12 },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    mapContainer: { flex: 1, position: 'relative' },
    map: { width: '100%', height: '100%' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14, fontWeight: '600' },
});
