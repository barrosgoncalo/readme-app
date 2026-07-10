import React, { useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    useColorScheme,
    ActivityIndicator,
    Text,
} from 'react-native';
import { auth } from '@readme/shared/src/services/firebase';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';

// Consolidated Domain Architectures
import { useSellerLocations } from '@readme/shared/src/hooks/user-seller-locations';
import { useLocationProposal } from '@readme/shared/src/hooks/use-location-proposal';
import { useFitMarkers } from '@readme/shared/src/hooks/use-fit-markers';
import ScreenHeader from '../../components/ui/ScreenHeader';
import LocationPickerMap from '../../components/ui/LocationPickerMap';
import MapSearchBar from '../../components/ui/MapSearchBar';
import SelectedLocationCard from '../../components/ui/SelectedLocationCard';
import OfferBottomDock from '../../components/ui/OfferBottomDock';

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

        const finalTargetId = targetSeller?.uid || targetBook?.ownerId || targetBook?.userId;

        try {
            const chatId = await ChatService.sendInitialOffer(
                currentUserId,
                finalTargetId,
                targetBook,
                offeredBooks,
                activeLocationSelection
            );

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
            <ScreenHeader
                title={isProposingAlternative ? "Propose Custom Spot" : "Choose Exchange Location"}
                onBack={() => navigation.goBack()}
                theme={theme}
            />

            <View style={styles.mapContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.primary || "#E58A1F"} />
                        <Text style={[styles.loadingText, { color: theme.subtext }]}>Finding spots...</Text>
                    </View>
                ) : (
                    <LocationPickerMap
                        mapRef={mapRef}
                        theme={theme}
                        style={styles.map}
                        initialRegion={currentRegion}
                        onMapReady={() => setMapReady(true)}
                        onRegionChangeComplete={setCurrentRegion}
                        isProposingAlternative={isProposingAlternative}
                        onMapPress={handleReverseGeocode}
                        onMarkerDragEnd={handleReverseGeocode}
                        sellerLocations={sellerLocations}
                        selectedLocation={selectedLocation}
                        onSelectLocation={setSelectedLocation}
                        customLocation={customLocation}
                    />
                )}

                {isProposingAlternative && (
                    <MapSearchBar theme={theme} mapRef={mapRef} onLocationFound={handleReverseGeocode} />
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
    mapContainer: { flex: 1, position: 'relative' },
    map: { width: '100%', height: '100%' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14, fontWeight: '600' },
});
