import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    ActivityIndicator, useColorScheme, Image, Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Iconify } from 'react-native-iconify';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@readme/shared/src/services/firebase';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { ChatService } from '@readme/shared/src/services/chat';
import { Colors } from '@readme/shared/src/constants/theme';

// Map Architectures
import { useSellerLocations } from '@readme/shared/src/hooks/user-seller-locations';
import { useLocationProposal } from '@readme/shared/src/hooks/use-location-proposal';
import MapSearchBar from '../../components/ui/MapSearchBar';
import SelectedLocationCard from '../../components/ui/SelectedLocationCard';
import OfferBottomDock from '../../components/ui/OfferBottomDock';

export default function SelectSwapBookScreen({ route, navigation }) {
    const { messageId, chatId, offerDetails, targetSellerUid } = route.params;
    const { currentUser } = useAuth();
    
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    // --- Book Selection State ---
    const [offeredBooks, setOfferedBooks] = useState([]);
    const [selectedBookId, setSelectedBookId] = useState(null);
    const [isLoadingBooks, setIsLoadingBooks] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 🌟 --- Full Screen Map State ---
    const [isMapFullScreen, setIsMapFullScreen] = useState(false);

    // --- Map Architectures ---
    const mapRef = useRef(null);
    const { sellerLocations, loading: mapLoading } = useSellerLocations(targetSellerUid || '');

    const originalLocation = offerDetails?.location;

    const defaultRegion = currentRegion || (originalLocation?.latitude ? {
        latitude: originalLocation.latitude,
        longitude: originalLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    } : null);
    
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

    // --- Fetch Books ---
    useEffect(() => {
        const fetchOfferedBooks = async () => {
            if (!offerDetails?.offeredBookIds?.length) {
                setIsLoadingBooks(false);
                return;
            }
            try {
                const bookPromises = offerDetails.offeredBookIds.map(id => getDoc(doc(db, 'publications', id)));
                const bookSnaps = await Promise.all(bookPromises);
                const loadedBooks = bookSnaps
                    .filter(snap => snap.exists())
                    .map(snap => ({ id: snap.id, ...snap.data() }));
                setOfferedBooks(loadedBooks);
            } catch (error) {
                console.error("Failed to fetch offered books:", error);
            } finally {
                setIsLoadingBooks(false);
            }
        };
        fetchOfferedBooks();
    }, []);

    // --- Final Submission ---
    const handleSendCounter = async () => {
        if (isSubmitting) return; 
        
        if (!selectedBookId || !locationIsValid || !currentUser?.uid) return;
        
        setIsSubmitting(true);
        try {
            const selectedBook = offeredBooks.find(b => b.id === selectedBookId);
            const imageUrl = selectedBook?.book?.images?.[0] || selectedBook?.imageUrl || null;

            const updatedOfferDetails = {
                ...offerDetails,
                selectedBookImage: imageUrl
            };

            await ChatService.sendCounterOffer(
                chatId, 
                messageId, 
                currentUser.uid, 
                updatedOfferDetails,
                selectedBookId,
                activeLocationSelection
            );
            navigation.goBack(); 
        } catch (error) {
            console.error("Failed to send counter:", error);
            setIsSubmitting(false);
        }
    };

    const renderBookItem = ({ item }) => {
        const isSelected = selectedBookId === item.id;
        const imageUrl = item.book?.images?.[0] || item.imageUrl || 'https://via.placeholder.com/150';

        return (
            <TouchableOpacity 
                style={[
                    styles.bookCard, 
                    { backgroundColor: theme.backgroundElement, borderColor: isSelected ? theme.primary : theme.borderLight }
                ]}
                onPress={() => setSelectedBookId(item.id)}
            >
                <Image source={{ uri: imageUrl }} style={styles.bookImage} />
                <View style={styles.bookInfo}>
                    <Text style={[styles.bookTitle, { color: theme.textItemTitle }]} numberOfLines={1}>
                        {item.book?.title || 'Unknown Title'}
                    </Text>
                    <Text style={[styles.bookAuthor, { color: theme.subtext }]} numberOfLines={1}>
                        {item.book?.author || 'Unknown Author'}
                    </Text>
                </View>
                {isSelected && (
                    <View style={styles.checkBadge}>
                        <Iconify icon="lucide:check-circle-2" size={20} color={theme.primary} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header - Hidden in Full Screen */}
            {!isMapFullScreen && (
                <SafeAreaView edges={['top']} style={[styles.header, { borderBottomColor: theme.borderLight }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.textItemTitle }]}>Counter Proposal</Text>
                    <View style={{ width: 32 }} />
                </SafeAreaView>
            )}

            {/* TOP HALF: Horizontal Book List - Hidden in Full Screen */}
            {!isMapFullScreen && (
                <View style={[styles.bookSection, { borderBottomColor: theme.borderLight }]}>
                    <Text style={[styles.sectionLabel, { color: theme.textItemTitle }]}>1. Select a Book</Text>
                    {isLoadingBooks ? (
                        <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 20 }} />
                    ) : (
                        <FlatList
                            data={offeredBooks}
                            keyExtractor={item => item.id}
                            renderItem={renderBookItem}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.bookListContainer}
                        />
                    )}
                </View>
            )}

            {/* BOTTOM HALF: Map Integration */}
            <View style={[styles.mapSection, isMapFullScreen && styles.fullScreenMapSection]}>
                {/* Section label is hidden in full screen to maximize space */}
                {!isMapFullScreen && (
                    <Text style={[styles.sectionLabel, { color: theme.textItemTitle, paddingHorizontal: 16, paddingTop: 16 }]}>
                        2. Select Exchange Location
                    </Text>
                )}

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
                            onRegionChangeComplete={setCurrentRegion}
                            onPress={(e) => isProposingAlternative && handleReverseGeocode(e.nativeEvent.coordinate)}
                            onPanDrag={Keyboard.dismiss}
                            initialRegion={defaultRegion} 
                            region={defaultRegion} 
                        >
                            {!isProposingAlternative && originalLocation?.latitude && (
                                <Marker
                                    key="original-offer-location"
                                    coordinate={{
                                        latitude: originalLocation.latitude,
                                        longitude: originalLocation.longitude
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
                                        coordinate={loc}
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

                    {/* 🌟 Floating Full Screen Toggle Button */}
                    <TouchableOpacity 
                        style={[
                            styles.fullscreenButton, 
                            { backgroundColor: theme.backgroundElement, borderColor: theme.borderLight },
                            isMapFullScreen ? styles.fullscreenButtonActive : styles.fullscreenButtonFloating
                        ]}
                        onPress={() => setIsMapFullScreen(!isMapFullScreen)}
                    >
                        <Iconify 
                            icon={isMapFullScreen ? "lucide:minimize-2" : "lucide:maximize-2"} 
                            size={20} 
                            color={theme.textItemTitle} 
                        />
                    </TouchableOpacity>

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
            </View>

            {/* FOOTER: Validation Pipeline */}
            <OfferBottomDock 
                theme={theme}
                canSend={selectedBookId !== null && locationIsValid && !isSubmitting}
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    backButton: { padding: 4 },
    sectionLabel: { fontSize: 16, fontWeight: '700', marginLeft: 16, marginBottom: 8 },
    bookSection: { height: 160, paddingTop: 16, borderBottomWidth: 1 },
    bookListContainer: { paddingHorizontal: 16, gap: 12 },
    bookCard: { width: 220, flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 2 },
    bookImage: { width: 45, height: 65, borderRadius: 6, backgroundColor: '#EAEAEA' },
    bookInfo: { flex: 1, marginLeft: 10, justifyContent: 'center' },
    bookTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
    bookAuthor: { fontSize: 13 },
    checkBadge: { position: 'absolute', top: 8, right: 8 },
    mapSection: { flex: 1, position: 'relative' },
    // 🌟 Styling adjustments when fullscreen mode changes
    fullScreenMapSection: {
        flex: 1,
        marginTop: 0,
    },
    mapContainer: { flex: 1, marginTop: 8, position: 'relative' },
    map: { width: '100%', height: '100%' },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    // 🌟 Floating Toggle Button Styles
    fullscreenButton: {
        position: 'absolute',
        right: 16,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 10,
    },
    fullscreenButtonFloating: {
        top: 16,
    },
    fullscreenButtonActive: {
        top: 50, // Pushes down to clear camera notches / status bars when header is missing
    }
});
