import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    useColorScheme, 
    ActivityIndicator, 
    Keyboard 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Iconify } from 'react-native-iconify';
import { Colors } from '@readme/shared/src/constants/theme';
import * as Location from 'expo-location';

// Custom Hooks & Modular Sub-Components Architecture
import { useSellerLocations } from '@readme/shared/src/hooks/user-seller-locations';
import MapSearchBar from '../../../components/ui/MapSearchBar';
import SelectedLocationCard from '../../../components/ui/SelectedLocationCard';
import OfferBottomDock from '../../../components/ui/OfferBottomDock';

// ====================================================================
// DESIGN CONSTANTS & CONFIGURATION
// ====================================================================
const DEFAULT_MAP_VIEWPORT = { 
    latitude: 38.7223, 
    longitude: -9.1393, 
    latitudeDelta: 0.08, 
    longitudeDelta: 0.08 
};

/**
 * StepTwoOfferScreen
 * Handles the secondary stage of the transactional offer pipeline.
 * Coordinates rendering pre-defined seller meet-up points alongside an
 * interactive alternative custom placement workspace using reverse geocoding.
 */
export default function StepTwoOfferScreen({ route, navigation }) {
    // --- Theme & Navigation Context ---
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { targetBook, offeredBooks = [] } = route.params;

    // --- References ---
    const mapRef = useRef(null);

    // --- Isolated Remote Data Queries ---
    // Custom hook queries Firebase profile fields and transforms address schemas into coordinates
    const { sellerLocations, loading } = useSellerLocations(targetBook?.uid);

    // --- UI/UX Interaction States ---
    // Tracks the predefined marker chosen by the user
    const [selectedLocation, setSelectedLocation] = useState(null);
    
    // Toggles the interface overlay into alternative custom drop-pin workspace mode
    const [isProposingAlternative, setIsProposingAlternative] = useState(false);
    
    // Captures structural geometry and reverse geocoded textual metadata for custom coordinates
    const [customLocation, setCustomLocation] = useState(null);
    
    // Toggled true during reverse coordinate text translations to handle async visual responses
    const [geocodingCustom, setGeocodingCustom] = useState(false);
    
    // Captures active map tracking values to anchor subsequent custom workflows
    const [currentRegion, setCurrentRegion] = useState(DEFAULT_MAP_VIEWPORT);

    // ====================================================================
    // LIFECYCLE EFFECTS
    // ====================================================================

    /**
     * Effect: Responsive Viewport Camera Controller.
     * Evaluates marker changes to calculate and execute map bounding fits or centering transitions.
     */
    useEffect(() => {
        // Skip automatic framing changes if user is designing a custom alternative spot
        if (mapRef.current && sellerLocations.length > 0 && !isProposingAlternative) {
            const viewportTimer = setTimeout(() => {
                if (sellerLocations.length === 1) {
                    // Smooth linear tracking shift for lone coordinates
                    mapRef.current.animateToRegion({
                        latitude: sellerLocations[0].latitude,
                        longitude: sellerLocations[0].longitude,
                        latitudeDelta: 0.04, 
                        longitudeDelta: 0.04,
                    }, 1000); 
                } else {
                    // Compound calculation matrix framing all coordinates safely with custom bottom padding allowances
                    mapRef.current.fitToCoordinates(sellerLocations, {
                        edgePadding: { top: 80, right: 80, bottom: 360, left: 80 },
                        animated: true,
                    });
                }
            }, 400); // 400ms delay window protects map canvas instantiation integrity across frames

            return () => clearTimeout(viewportTimer);
        }
    }, [sellerLocations, isProposingAlternative]);

    // ====================================================================
    // COORD ENGINE & ADAPTER ROUTINES
    // ====================================================================

    /**
     * Reverse Geocoding Engine.
     * Takes raw map coordinates, contacts localized geospatial mapping clients,
     * and compiles a cleanly formatted string address structure.
     * * @param {Object} coords - Spatial latitude and longitude values.
     */
    const handleReverseGeocode = async (coords) => {
        setGeocodingCustom(true);
        try {
            const response = await Location.reverseGeocodeAsync(coords);
            const place = response[0];

            // Setup a fallback absolute geometry string if network layers return unpopulated strings
            let address = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
            
            if (place) {
                const street = place.street || place.name || "Custom Spot";
                const streetNumber = place.streetNumber ? ` ${place.streetNumber}` : "";
                const district = place.district ? `, ${place.district}` : "";
                const city = place.city ? `, ${place.city}` : "";
                
                address = `${street}${streetNumber}${district}${city}`;
            }

            // Sync structured state model properties
            setCustomLocation({
                id: 'proposed_custom',
                title: 'Proposed Custom Location',
                address,
                latitude: coords.latitude,
                longitude: coords.longitude
            });
        } catch (error) {
            console.warn("[Reverse Geocoding Runtime Warning]", error);
        } finally {
            setGeocodingCustom(false);
        }
    };

    /**
     * Initializes alternative selection canvas mode, purging previous state selections
     * and resolving the exact point directly under the user's current camera center view.
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
     * Teardown routine to safely reset custom workspaces and exit back to primary layouts.
     */
    const handleCancelAlternative = () => {
        setIsProposingAlternative(false);
        setCustomLocation(null);
        Keyboard.dismiss();
    };

    /**
     * Compiles payload arguments and passes contextual metrics to parent navigation flows.
     */
    const handleSendOffer = () => {
        const finalLocation = isProposingAlternative ? customLocation : selectedLocation;
        if (!finalLocation) return;

        const offeredTitles = offeredBooks
            .map(item => item.book?.title || item.title || 'Unknown Title')
            .join(', ');

        Alert.alert(
            "Offer Ready to Send!",
            `Offering: ${offeredTitles}\nFor: ${targetBook.title}\nAt: ${finalLocation.title}\n(${finalLocation.address})`,
            [
                { text: "Send to Chat", onPress: () => navigation.popToTop() },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    // --- Reactive Layout Selectors ---
    const activeLocationSelection = isProposingAlternative ? customLocation : selectedLocation;
    const canSend = isProposingAlternative ? (customLocation && !geocodingCustom) : !!selectedLocation;

    // ====================================================================
    // UI RENDERING LIFECYCLE
    // ====================================================================
    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>

            {/* --- TOP HEADER NAVIGATION TIER --- */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.textItemTitle }]}>
                    {isProposingAlternative ? "Propose Custom Spot" : "Choose Exchange Location"}
                </Text> 
                {/* Visual architectural balance element anchor */}
                <View style={{ width: 24 }}/>
            </SafeAreaView>

            {/* --- CORE VISUAL MAP ENGINE SURFACE --- */}
            <View style={styles.mapContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.primary || "#E58A1F"} />
                        <Text style={[styles.loadingText, { color: theme.subtext }]}>Finding spots...</Text>
                    </View>
                ) : (
                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_DEFAULT}
                        style={styles.map}
                        onRegionChangeComplete={setCurrentRegion}
                        onPress={(e) => isProposingAlternative && handleReverseGeocode(e.nativeEvent.coordinate)}
                        onPanDrag={Keyboard.dismiss}
                        initialRegion={currentRegion}
                    >
                        {/* Predefined Seller Locations Layer */}
                        {!isProposingAlternative && sellerLocations.map((loc) => (
                            <Marker
                                key={loc.id}
                                coordinate={loc}
                                title={loc.title}
                                description={loc.address}
                                pinColor={selectedLocation?.id === loc.id ? (theme.primary || "#E58A1F") : "#A35C37"}
                                onPress={() => setSelectedLocation(loc)}
                            />
                        ))}

                        {/* Custom Interactive Floating Workspace Layer */}
                        {isProposingAlternative && customLocation && (
                            <Marker
                                draggable
                                coordinate={customLocation}
                                title="Your Custom Proposal"
                                description="Drag me or tap somewhere else!"
                                pinColor="#E53E3E" 
                                onMarkerDragEnd={(e) => handleReverseGeocode(e.nativeEvent.coordinate)}
                            />
                        )}
                    </MapView>
                )}

                {/* --- FLOATING WORKSPACE COMPONENT OVERLAYS --- */}

                {/* Sub-component: Forward Geocoding Text Search Bar Input */}
                {isProposingAlternative && (
                    <MapSearchBar 
                        theme={theme} 
                        mapRef={mapRef} 
                        onLocationFound={handleReverseGeocode} 
                    />
                )}

                {/* Sub-component: Contextual Detail Map Display Card */}
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

            {/* --- FIXATED FOOTER DOCK ACTION PLATFORM --- */}
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

// ====================================================================
// STYLE SHEET SPECIFICATIONS
// ====================================================================
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
