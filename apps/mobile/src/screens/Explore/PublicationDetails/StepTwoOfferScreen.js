import React, { useRef, useState, useEffect } from 'react';
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
import { db, auth } from '@readme/shared/src/services/firebase'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Iconify } from 'react-native-iconify';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes'; 

// Consolidated Domain Architectures
import { useSellerLocations } from '@readme/shared/src/hooks/user-seller-locations';
import { useLocationProposal } from '@readme/shared/src/hooks/use-location-proposal';
import { useFitMarkers } from '@readme/shared/src/hooks/use-fit-markers';
import MapSearchBar from '../../../components/ui/MapSearchBar';
import SelectedLocationCard from '../../../components/ui/SelectedLocationCard';
import OfferBottomDock from '../../../components/ui/OfferBottomDock';

// Services
import { ChatService } from '@readme/shared/src/services/chat';

export default function StepTwoOfferScreen({ route, navigation }) {

    const [mapReady, setMapReady] = useState(false);

    // --- Theme & Context Routing ---
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    
    const { targetBook, targetSeller, offeredBooks = [] } = route.params;

    // --- Component Architectural Anchors ---
    const mapRef = useRef(null);

    // --- Core Data Query Layer ---
    const { sellerLocations, loading } = useSellerLocations(targetBook.ownerId);

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


    useFitMarkers({
        mapRef,
        mapReady,
        loading,
        locations: sellerLocations,
        isProposingAlternative,
    });

    // --- Final Context Routing Action ---
    const handleSendOffer = async () => {
        const currentUserId = auth.currentUser?.uid;

        if (!activeLocationSelection || !currentUserId) {
            console.warn("Missing location selection or user is not logged in.");
            return;
        }

        // Determine the correct target ID safely
        const finalTargetId = targetSeller?.uid || targetBook?.ownerId || targetBook?.userId;

        try {
            const chatId = await ChatService.sendInitialOffer(
                currentUserId,
                finalTargetId, 
                targetBook,
                offeredBooks,
                activeLocationSelection
            );

            // Pipe the exact, guaranteed UI data into the Chat Room
            navigation.navigate(ROUTES.CHAT_ROOM, { 
                chatId, 
                targetSeller: targetSeller || { 
                    name: targetBook?.ownerName || "Anonymous Swapper", 
                    uid: finalTargetId,
                    avatarUrl: targetBook?.ownerAvatar || null
                }
            });
        } catch (error) {
            console.error("Failed to execute swap transaction pipeline:", error);
        }
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
                            onMapReady={() => setMapReady(true)}
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
                                    pinColor={selectedLocation?.id === loc.id ? (theme.primary || "#E58A1F") : "#A35C37"}
                                    onPress={() => setSelectedLocation(loc)}
                                />
                            ))}

                            {/* Custom Interactive Floating Workspace Layer */}
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
