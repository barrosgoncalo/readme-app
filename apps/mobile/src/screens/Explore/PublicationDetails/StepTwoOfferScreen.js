import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, useColorScheme, ActivityIndicator, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Iconify } from 'react-native-iconify';
import { Colors } from '@readme/shared/src/constants/theme';

// Consolidated Domain Architectures
import { useSellerLocations } from '@readme/shared/src/hooks/user-seller-locations';
import { useLocationProposal } from '@readme/shared/src/hooks/use-location-proposal';
import MapSearchBar from '../../../components/ui/MapSearchBar';
import SelectedLocationCard from '../../../components/ui/SelectedLocationCard';
import OfferBottomDock from '../../../components/ui/OfferBottomDock';

export default function StepTwoOfferScreen({ route, navigation }) {
    // --- Theme & Context Routing ---
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { targetBook, offeredBooks = [] } = route.params;

    // --- Component Architectural Anchors ---
    const mapRef = useRef(null);

    // --- Core Data Query Layer ---
    const { sellerLocations, loading } = useSellerLocations(targetBook?.uid);

    // --- Combined Core Logic Layer ---
    const {
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
    } = useLocationProposal(sellerLocations, mapRef);

    // --- Final Context Routing Action ---
    const handleSendOffer = () => {
        if (!activeLocationSelection) return;

        const offeredTitles = offeredBooks
        .map(item => item.book?.title || item.title || 'Unknown Title')
        .join(', ');

        Alert.alert(
            "Offer Ready to Send!",
            `Offering: ${offeredTitles}\nFor: ${targetBook.title}\nAt: ${activeLocationSelection.title}\n(${activeLocationSelection.address})`,
            [
                { text: "Send to Chat", onPress: () => navigation.popToTop() },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

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
                {isProposingAlternative && (
                    <MapSearchBar 
                        theme={theme} 
                        mapRef={mapRef} 
                        onLocationFound={handleReverseGeocode} 
                    />
                )}

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
