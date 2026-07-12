import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    ActivityIndicator,
    Text,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { buildOfferFlowStyles } from '../../styles/offerFlowStyles';

// Consolidated Domain Architectures
import { useSellerLocations } from '@readme/shared/src/hooks/use-seller-locations';
import { useLocationProposal } from '@readme/shared/src/hooks/use-location-proposal';
import { useFitMarkers } from '@readme/shared/src/hooks/use-fit-markers';
import ScreenHeader from '../../components/ui/ScreenHeader';
import LocationPickerMap from '../../components/ui/LocationPickerMap';
import MapSearchBar from '../../components/ui/MapSearchBar';
import SelectedLocationCard from '../../components/ui/SelectedLocationCard';
import OfferBottomDock from '../../components/ui/OfferBottomDock';

// Services
import { ChatService } from '@readme/shared/src/services/chat';

// Contexts
import { useOffer } from '@readme/shared/src/contexts/OfferContext';

export default function StepTwoOfferScreen({ navigation }) {
    const [mapReady, setMapReady] = useState(false);
    const mapRef = useRef(null);

    // --- Theme & Context Routing ---
    const theme = useTheme();
    const styles = buildOfferFlowStyles(theme);

    const { offerDraft, clearOffer } = useOffer();
    const { targetBook, targetSeller, offeredBooks } = offerDraft;
    const { currentUser } = useAuth(); 

    const isFocused = useIsFocused()

    // Custom data hooks
    const { sellerLocations, loading } = useSellerLocations(targetBook?.ownerId);

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

    // GUARD CLAUSE
    useEffect(() => {
        if (!targetBook && isFocused) {
            navigation.goBack();
        }
    }, [targetBook, isFocused, navigation]);

    if (!targetBook) {
        return null;
    }

    // ACTION HANDLERS
    const handleSendOffer = async () => {
        const currentUserId = currentUser?.uid;

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

            clearOffer();

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

    // RENDER LAYERS
    return (
        <View style={styles.container}>
            <ScreenHeader
                title={isProposingAlternative ? "Propose Custom Spot" : "Choose Exchange Location"}
                onBack={() => navigation.goBack()}
                theme={theme}
            />

            <View style={styles.mapContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={styles.loadingText}>Finding spots...</Text>
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
