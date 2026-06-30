import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Alert,
    useColorScheme,
    ActivityIndicator,
    TextInput,
    Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Iconify } from 'react-native-iconify';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@readme/shared/src/constants/theme';

// Map & Firebase Isolation Imports
import * as Location from 'expo-location';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@readme/shared/src/services/firebase';

export default function StepTwoOfferScreen({ route, navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    
    const { targetBook, targetSeller, offeredBooks = [] } = route.params;
    
    // Core States
    const [sellerLocations, setSellerLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLocation, setSelectedLocation] = useState(null);
    
    // Alternative Custom Location States
    const [isProposingAlternative, setIsProposingAlternative] = useState(false);
    const [customLocation, setCustomLocation] = useState(null);
    const [geocodingCustom, setGeocodingCustom] = useState(false);
    
    // Address Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Keep track of where the user is looking on the map
    const [currentRegion, setCurrentRegion] = useState({
        latitude: 38.7223,
        longitude: -9.1393,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
    });

    const mapRef = useRef(null);

    // Fetch and geocode seller locations from Firebase
    useEffect(() => {
        const fetchAndGeocodeLocations = async () => {
            const sellerUid = targetBook?.uid;
            if (!sellerUid) {
                setLoading(false);
                return;
            }

            try {
                const sellerDocRef = doc(db, 'users', sellerUid);
                const sellerDocSnap = await getDoc(sellerDocRef);

                if (sellerDocSnap.exists()) {
                    const sellerData = sellerDocSnap.data();

                    const getGeocodedPin = async (fullAddressString, pinId, pinTitle) => {
                        try {
                            const result = await Location.geocodeAsync(fullAddressString);
                            if (result.length > 0) {
                                return {
                                    id: pinId,
                                    title: pinTitle,
                                    address: fullAddressString,
                                    latitude: result[0].latitude,
                                    longitude: result[0].longitude
                                };
                            }
                        } catch (error) {
                            console.warn(`Geocoding failed for ${pinTitle}:`, error);
                        }
                        return null;
                    };

                    const addressData = sellerData.institutionalAddress;
                    const geocodePromises = [];

                    if (addressData) {
                        const city = addressData.city || '';
                        const country = addressData.country || 'Portugal';
                        const cityCountry = `${city}, ${country}`.trim();

                        let address1String = addressData.addressLine1 || '';
                        address1String = address1String.replace(/n(?:º)?\s*(\d+)/i, 'nº $1');
                        
                        if (address1String && !address1String.toLowerCase().includes(city.toLowerCase())) {
                            address1String = `${address1String}, ${cityCountry}`;
                        }

                        if (addressData.addressLine1) {
                            geocodePromises.push(getGeocodedPin(address1String, 'primary_loc', 'Primary Location'));
                        }

                        if (addressData.addressLine2) {
                            let address2String = addressData.addressLine2;
                            const hasPostalCode = /\d{4}-\d{3}/.test(address2String);
                            const hasCountry = address2String.toLowerCase().includes('portugal');

                            if (!hasCountry) {
                                if (hasPostalCode) {
                                    address2String = `${address2String}, Portugal`;
                                } else {
                                    address2String = `${address2String}, ${cityCountry}`;
                                }
                            }
                            geocodePromises.push(getGeocodedPin(address2String, 'secondary_loc', 'Alternative Location'));
                        }
                    }

                    const resolvedPins = await Promise.all(geocodePromises);
                    let mappedLocations = resolvedPins.filter(pin => pin !== null);

                    if (mappedLocations.length === 0) {
                        mappedLocations = [
                            { id: 'fallback', title: 'Lisbon Center', address: 'Lisbon, Portugal', latitude: 38.7223, longitude: -9.1393 }
                        ];
                    }

                    setSellerLocations(mappedLocations);
                    
                    setCurrentRegion({
                        latitude: mappedLocations[0].latitude,
                        longitude: mappedLocations[0].longitude,
                        latitudeDelta: 0.08,
                        longitudeDelta: 0.08,
                    });
                }
            } catch (error) {
                console.error('[StepTwoOfferScreen] Error resolving seller profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAndGeocodeLocations();
    }, [targetBook?.uid]);

    // Automatically adjust map frame around seller pins
    useEffect(() => {
        if (mapRef.current && sellerLocations.length > 0 && !isProposingAlternative) {
            setTimeout(() => {
                if (sellerLocations.length === 1) {
                    mapRef.current.animateToRegion({
                        latitude: sellerLocations[0].latitude,
                        longitude: sellerLocations[0].longitude,
                        latitudeDelta: 0.04, 
                        longitudeDelta: 0.04,
                    }, 1000); 
                } else {
                    mapRef.current.fitToCoordinates(sellerLocations, {
                        edgePadding: { top: 80, right: 80, bottom: 360, left: 80 },
                        animated: true,
                    });
                }
            }, 400); 
        }
    }, [sellerLocations, isProposingAlternative]);

    // Forward Geocode: Convert Typed Address to Coordinates
    const handleSearchAddress = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        Keyboard.dismiss();
        
        try {
            const geocoded = await Location.geocodeAsync(searchQuery);
            if (geocoded.length > 0) {
                const { latitude, longitude } = geocoded[0];
                
                // Fly map to new searched spot
                mapRef.current?.animateToRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }, 1000);

                // Instantly update the custom pin and card based on the search
                handleReverseGeocode({ latitude, longitude });
            } else {
                Alert.alert("Location Not Found", "We couldn't find that address. Try adding a city or postal code.");
            }
        } catch (error) {
            console.warn("Search geocoding error:", error);
            Alert.alert("Error", "Something went wrong searching for that address.");
        } finally {
            setIsSearching(false);
        }
    };

    // Reverse Geocode: Convert Coordinates to Address Text
    const handleReverseGeocode = async (coords) => {
        setGeocodingCustom(true);
        try {
            const response = await Location.reverseGeocodeAsync({
                latitude: coords.latitude,
                longitude: coords.longitude
            });

            if (response.length > 0) {
                const place = response[0];
                const streetName = place.street || place.name || "Custom Spot";
                const streetNumber = place.streetNumber ? ` ${place.streetNumber}` : "";
                const neighborhood = place.district ? `, ${place.district}` : "";
                const cityName = place.city ? `, ${place.city}` : "";

                setCustomLocation({
                    id: 'proposed_custom',
                    title: 'Proposed Custom Location',
                    address: `${streetName}${streetNumber}${neighborhood}${cityName}`,
                    latitude: coords.latitude,
                    longitude: coords.longitude
                });
            } else {
                setCustomLocation({
                    id: 'proposed_custom',
                    title: 'Proposed Custom Location',
                    address: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
                    latitude: coords.latitude,
                    longitude: coords.longitude
                });
            }
        } catch (error) {
            console.warn("Reverse geocoding error:", error);
        } finally {
            setGeocodingCustom(false);
        }
    };

    // Initialize custom location pin right in the center of the current viewport
    const handleStartProposingAlternative = () => {
        setSelectedLocation(null);
        setSearchQuery(''); // Reset search bar
        setIsProposingAlternative(true);
        
        const centerCoords = {
            latitude: currentRegion.latitude,
            longitude: currentRegion.longitude
        };
        handleReverseGeocode(centerCoords);
    };

    // Gracefully exit alternative location mode
    const handleCancelAlternative = () => {
        setIsProposingAlternative(false);
        setCustomLocation(null);
        setSearchQuery('');
        Keyboard.dismiss();
    };

    // Handle map surface clicks during custom location placement
    const handleMapPress = (e) => {
        if (!isProposingAlternative) return;
        Keyboard.dismiss();
        handleReverseGeocode(e.nativeEvent.coordinate);
    };

    const handleSendOffer = () => {
        const finalLocation = isProposingAlternative ? customLocation : selectedLocation;
        if (!finalLocation) return;
        
        const offeredTitles = offeredBooks
            .map(item => item.book?.title || item.title || 'Unknown Title')
            .join(', ');
        
        Alert.alert(
            "Offer Ready to Send!",
            `You are offering: ${offeredTitles}\nIn exchange for: ${targetBook.title}\nMeeting at: ${finalLocation.title}\n(${finalLocation.address})`,
            [
                { 
                    text: "Send to Chat", 
                    onPress: () => {
                        console.log("Offer Payload:", { targetBook, targetSeller, offeredBooks, selectedLocation: finalLocation });
                        navigation.popToTop(); 
                    } 
                },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const activeLocationSelection = isProposingAlternative ? customLocation : selectedLocation;
    const canSend = isProposingAlternative ? (customLocation && !geocodingCustom) : !!selectedLocation;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            
            {/* Header Area */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.textItemTitle }]}>
                    {isProposingAlternative ? "Propose Custom Spot" : "Choose Exchange Location"}
                </Text>
                <View style={{ width: 24 }} /> 
            </SafeAreaView>

            {/* Map Area */}
            <View style={styles.mapContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.primary || "#E58A1F"} />
                        <Text style={[styles.loadingText, { color: theme.subtext }]}>Finding exchange spots...</Text>
                    </View>
                ) : (
                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_DEFAULT}
                        style={styles.map}
                        onRegionChangeComplete={setCurrentRegion}
                        onPress={handleMapPress}
                        onPanDrag={Keyboard.dismiss} // Dismiss keyboard when dragging map
                        initialRegion={currentRegion}
                    >
                        {/* Only show seller options if NOT in alternative proposal mode */}
                        {!isProposingAlternative && sellerLocations.map((loc) => (
                            <Marker
                                key={loc.id}
                                coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                                title={loc.title}
                                description={loc.address}
                                pinColor={selectedLocation?.id === loc.id ? (theme.primary || "#E58A1F") : "#A35C37"}
                                onPress={() => setSelectedLocation(loc)}
                            />
                        ))}

                        {/* Interactive Custom Alternative Pin */}
                        {isProposingAlternative && customLocation && (
                            <Marker
                                draggable
                                coordinate={{ latitude: customLocation.latitude, longitude: customLocation.longitude }}
                                title="Your Custom Proposal"
                                description="Drag me or tap somewhere else!"
                                pinColor="#E53E3E" 
                                onMarkerDragEnd={(e) => handleReverseGeocode(e.nativeEvent.coordinate)}
                            />
                        )}
                    </MapView>
                )}

                {/* Floating Search Bar Overlay (Only active during custom proposal) */}
                {isProposingAlternative && (
                    <View style={[styles.searchContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.borderLight }]}>
                        <Iconify icon="lucide:search" size={20} color={theme.subtext} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.textItemTitle }]}
                            placeholder="Search a street, cafe, or city..."
                            placeholderTextColor={theme.subtext}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearchAddress}
                            returnKeyType="search"
                            autoCorrect={false}
                        />
                        {isSearching ? (
                            <ActivityIndicator size="small" color={theme.primary || '#E58A1F'} />
                        ) : searchQuery.length > 0 ? (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color={theme.subtext} />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                )}

                {/* Floating Dynamic Action Card */}
                {!loading && activeLocationSelection && (
                    <View style={[styles.actionCard, { backgroundColor: theme.backgroundElement, borderColor: theme.borderLight }]}>
                        <View style={styles.actionCardHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.actionTitle, { color: theme.textItemTitle }]}>
                                    {activeLocationSelection.title}
                                </Text>
                                {geocodingCustom ? (
                                    <ActivityIndicator size="small" color={theme.primary} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
                                ) : (
                                    <Text style={[styles.actionSub, { color: theme.subtext }]}>{activeLocationSelection.address}</Text>
                                )}
                            </View>
                            <TouchableOpacity 
                                onPress={() => isProposingAlternative ? handleCancelAlternative() : setSelectedLocation(null)} 
                                style={{ padding: 4 }}
                            >
                                <Ionicons name="close" size={20} color={theme.subtext} />
                            </TouchableOpacity>
                        </View>
                        {isProposingAlternative && (
                            <Text style={styles.helperText}>💡 Tip: Search an address above, drag the red pin, or tap anywhere on the map.</Text>
                        )}
                    </View>
                )}
            </View>

            {/* Grounded Floating Bottom Action Dock */}
            <SafeAreaView edges={['bottom']} style={[styles.bottomBar, { 
                backgroundColor: theme.backgroundElement,
                borderTopColor: theme.borderLight
            }]}>
                <TouchableOpacity 
                    style={[
                        styles.sendButton, 
                        { 
                            backgroundColor: canSend ? (theme.primary || '#E58A1F') : theme.borderLight,
                            shadowColor: canSend ? (theme.primary || '#E58A1F') : '#000',
                            elevation: canSend ? 8 : 0,
                        }
                    ]} 
                    onPress={handleSendOffer}
                    disabled={!canSend || loading}
                    activeOpacity={0.85}
                >
                    <Iconify icon="lucide:send" size={20} color={canSend ? '#FFFFFF' : theme.subtext} />
                    <Text style={[
                        styles.sendButtonText, 
                        { color: canSend ? '#FFFFFF' : theme.subtext }
                    ]}>
                        {isProposingAlternative ? "Propose This Spot" : "Send Offer"}
                    </Text>
                </TouchableOpacity>
                
                {isProposingAlternative ? (
                    <TouchableOpacity style={styles.proposeAlternativeButton} onPress={handleCancelAlternative}>
                        <Text style={[styles.proposeAlternativeText, { color: '#E53E3E' }]}>Cancel and use seller's locations</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.proposeAlternativeButton} onPress={handleStartProposingAlternative}>
                        <Text style={[styles.proposeAlternativeText, { color: theme.secondary || '#E58A1F' }]}>Or propose a different location</Text>
                    </TouchableOpacity>
                )}
            </SafeAreaView>
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
    
    // Search Bar Styles
    searchContainer: {
        position: 'absolute',
        top: 16,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 52,
        borderRadius: 26,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
        fontSize: 15,
        fontWeight: '500',
        height: '100%',
    },

    // Action Card Styles
    actionCard: { position: 'absolute', bottom: 140, left: 20, right: 20, padding: 16, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
    actionCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    actionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    actionSub: { fontSize: 13, lineHeight: 18 },
    helperText: { fontSize: 11, color: '#A35C37', marginTop: 10, fontStyle: 'italic' },
    
    // Bottom Bar Styles
    bottomBar: { 
        position: 'absolute',
        bottom: 0,
        width: '100%',
        paddingHorizontal: 24, 
        paddingTop: 16, 
        paddingBottom: 16, 
        borderTopWidth: 1, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: -4 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 12, 
        elevation: 10 
    },
    sendButton: { 
        width: '100%', 
        borderRadius: 16, 
        paddingVertical: 16, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    sendButtonText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
    proposeAlternativeButton: { marginTop: 14, alignItems: 'center', paddingVertical: 4 },
    proposeAlternativeText: { fontSize: 14, fontWeight: '600' }
});
