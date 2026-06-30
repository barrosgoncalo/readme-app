import React, { useState, useRef } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Alert,
    useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Iconify } from 'react-native-iconify';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@readme/shared/src/constants/theme';

export default function StepTwoOfferScreen({ route, navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    
    // 1. Updated to pull 'offeredBooks' array from Step 1 params
    const { targetBook, targetSeller, offeredBooks = [] } = route.params;
    
    const sellerLocations = [
        { id: '1', title: 'Primary Location', address: 'Lisbon City Center', latitude: 38.7223, longitude: -9.1393 },
        { id: '2', title: 'University Campus', address: 'Cidade Universitária', latitude: 38.7523, longitude: -9.1578 }
    ];

    const [selectedLocation, setSelectedLocation] = useState(null);
    const mapRef = useRef(null);

    const handleSendOffer = () => {
        if (!selectedLocation) return;
        
        // 2. Map through selected books to compile titles for the alert text safely
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
        // 3. Changed root to standard View to stop layout squeezing
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            
            {/* 4. Isolated Top Edge safe area */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.textItemTitle }]}>Choose Exchange Location</Text>
                <View style={{ width: 24 }} /> 
            </SafeAreaView>

            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_DEFAULT}
                    style={styles.map}
                    initialRegion={{
                        latitude: 38.7223,
                        longitude: -9.1393,
                        latitudeDelta: 0.08,
                        longitudeDelta: 0.08,
                    }}
                >
                    {sellerLocations.map((loc) => (
                        <Marker
                            key={loc.id}
                            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                            title={loc.title}
                            pinColor={selectedLocation?.id === loc.id ? (theme.primary || "#E58A1F") : "#A35C37"}
                            onPress={() => setSelectedLocation(loc)}
                        />
                    ))}
                </MapView>

                {/* 5. Lifted action card bottom position slightly so it clears the floating bar */}
                {selectedLocation && (
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

            {/* 6. Premium Grounded Floating Bottom Bar matching Step 1 & Book Details */}
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
                    disabled={!selectedLocation}
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
    // Placed above the bottomBar layer cleanly
    actionCard: { position: 'absolute', bottom: 140, left: 20, right: 20, padding: 16, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
    actionCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    actionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    actionSub: { fontSize: 13 },
    // Exact structural clone of the bottom bar configuration from BookDetails/Step 1
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
