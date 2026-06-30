import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Alert,
    useColorScheme,
    ActivityIndicator
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
    
    // States for dynamic location loading
    const [sellerLocations, setSellerLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const mapRef = useRef(null);

    // 1. Fetch and geocode locations directly on this screen using the seller's UID
    useEffect(() => {
        const fetchAndGeocodeLocations = async () => {
            const sellerUid = targetBook?.uid;
            if (!sellerUid) {
                console.warn('[StepTwoOfferScreen] Missing seller UID from targetBook.');
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
                            console.warn(`[StepTwoOfferScreen] Geocoding failed for ${pinTitle}:`, error);
                        }
                        return null;
                    };

                    const addressData = sellerData.institutionalAddress;
                    const geocodePromises = [];

                    if (addressData) {
                        const city = addressData.city || '';
                        const country = addressData.country || 'Portugal';
                        const cityCountry = `${city}, ${country}`.trim();

                        // Process Address Line 1
                        let address1String = addressData.addressLine1 || '';
                        address1String = address1String.replace(/n(?:º)?\s*(\d+)/i, 'nº $1');
                        
                        if (address1String && !address1String.toLowerCase().includes(city.toLowerCase())) {
                            address1String = `${address1String}, ${cityCountry}`;
                        }

                        if (addressData.addressLine1) {
                            geocodePromises.push(getGeocodedPin(address1String, 'primary_loc', 'Primary Location'));
                        }

                        // Process Address Line 2
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

                    // Ultimate safety fallback if no addresses geocode properly
                    if (mappedLocations.length === 0) {
                        mappedLocations = [
                            { id: 'fallback', title: 'Lisbon Center', address: 'Lisbon, Portugal', latitude: 38.7223, longitude: -9.1393 }
                        ];
                    }

                    setSellerLocations(mappedLocations);
                }
            } catch (error) {
                console.error('[StepTwoOfferScreen] Error resolving seller profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAndGeocodeLocations();
    }, [targetBook?.uid]);

    // 2. Animate and frame map viewport around the resolved pins
    useEffect(() => {
        if (mapRef.current && sellerLocations.length > 0) {
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
    }, [sellerLocations]);

    const handleSendOffer = () => {
        if (!selectedLocation) return;
        
        const offeredTitles = offeredBooks
            .map(item => item.book?.title || item.title || 'Unknown Title')
            .join(', ');
        
        Alert.alert(
            "Offer Ready to Send!",
            `You are offering: ${offeredTitles}\nIn exchange for: ${targetBook.title}\nMeeting at: ${selectedLocation.title}`,
            [
                { 
                    text: "Send to Chat", 
                    onPress: () => {
                        console.log("Offer Payload:", { targetBook, targetSeller, offeredBooks, selectedLocation });
                        navigation.popToTop(); 
                    } 
                },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            
            {/* Header Area */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.textItemTitle }]}>Choose Exchange Location</Text>
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
                        initialRegion={{
                            latitude: sellerLocations[0]?.latitude || 38.7223,
                            longitude: sellerLocations[0]?.longitude || -9.1393,
                            latitudeDelta: 0.08,
                            longitudeDelta: 0.08,
                        }}
                    >
                        {sellerLocations.map((loc) => (
                            <Marker
                                key={loc.id}
                                coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                                title={loc.title}
                                description={loc.address}
                                pinColor={selectedLocation?.id === loc.id ? (theme.primary || "#E58A1F") : "#A35C37"}
                                onPress={() => setSelectedLocation(loc)}
                            />
                        ))}
                    </MapView>
                )}

                {/* Floating Dynamic Action Card */}
                {!loading && selectedLocation && (
                    <View style={[styles.actionCard, { backgroundColor: theme.backgroundElement, borderColor: theme.borderLight }]}>
                        <View style={styles.actionCardHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.actionTitle, { color: theme.textItemTitle }]}>{selectedLocation.title}</Text>
                                <Text style={[styles.actionSub, { color: theme.subtext }]}>{selectedLocation.address}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedLocation(null)} style={{ padding: 4 }}>
                                <Ionicons name="close" size={20} color={theme.subtext} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            {/* Premium Grounded Floating Bottom Bar */}
            <SafeAreaView edges={['bottom']} style={[styles.bottomBar, { 
                backgroundColor: theme.backgroundElement,
                borderTopColor: theme.borderLight
            }]}>
                <TouchableOpacity 
                    style={[
                        styles.sendButton, 
                        { 
                            backgroundColor: selectedLocation ? (theme.primary || '#E58A1F') : theme.borderLight,
                            shadowColor: selectedLocation ? (theme.primary || '#E58A1F') : '#000',
                            elevation: selectedLocation ? 8 : 0,
                        }
                    ]} 
                    onPress={handleSendOffer}
                    disabled={!selectedLocation || loading}
                    activeOpacity={0.85}
                >
                    <Iconify icon="lucide:send" size={20} color={selectedLocation ? '#FFFFFF' : theme.subtext} />
                    <Text style={[
                        styles.sendButtonText, 
                        { color: selectedLocation ? '#FFFFFF' : theme.subtext }
                    ]}>Send Offer</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.proposeAlternativeButton} onPress={() => Alert.alert("Feature", "Open a custom location picker here.")}>
                    <Text style={[styles.proposeAlternativeText, { color: theme.secondary || '#E58A1F' }]}>Or propose a different location</Text>
                </TouchableOpacity>
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
    actionCard: { position: 'absolute', bottom: 140, left: 20, right: 20, padding: 16, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
    actionCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    actionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    actionSub: { fontSize: 13 },
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
    proposeAlternativeButton: { marginTop: 14, alignItems: 'center' },
    proposeAlternativeText: { fontSize: 14, fontWeight: '600' }
});
