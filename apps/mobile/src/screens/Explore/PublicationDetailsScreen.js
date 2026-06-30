import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    StatusBar, 
    Dimensions, 
    useColorScheme, 
    StyleSheet, 
    Alert, 
    Linking, 
    Platform
} from 'react-native';
import { Colors } from '@readme/shared/src/constants/theme';
import { buildBookDetailsStyles } from '../../styles/publicationDetailsStyles';
import { Image } from 'expo-image';
import ImageViewing from 'react-native-image-viewing';
import { TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Iconify } from 'react-native-iconify';

// Map Imports
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

// Firebase Imports
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@readme/shared/src/services/firebase'; 

const { width } = Dimensions.get('window');

const GalleryImageWrapper = ({ source, style, onLoad, ...props }) => (
    <Image
        source={source}
        style={style}
        contentFit="contain"
        onLoad={(e) => {
            if (onLoad) {
                onLoad({
                    nativeEvent: {
                        source: {
                            width: e.source.width,
                            height: e.source.height,
                        },
                    },
                });
            }
        }}
        {...props}
    />
);

export default function BookDetailsScreen({ route, navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildBookDetailsStyles(theme);

    const [isGalleryVisible, setIsGalleryVisible] = useState(false);

    const passedBook = route?.params?.book;
    const passedSeller = route?.params?.seller;

    const auth = getAuth();
    const currentUser = auth.currentUser;
    const bookId = passedBook?.id; 

    const bookImages = passedBook?.publicationData?.book?.images?.length > 0 
        ? passedBook.publicationData.book.images 
        : ['https://via.placeholder.com/400x600'];

    const book = {
        title: passedBook?.publicationData?.book?.title || 'Unknown Title',
        author: passedBook?.publicationData?.book?.author || 'Unknown Author',
        description: passedBook?.publicationData?.detailsText || "No description provided for this book.",
        condition: passedBook?.publicationData?.book?.condition || 'Condition not specified',
        subject: passedBook?.publicationData?.book?.subject || 'Not specified',
        images: bookImages,
        uid: passedBook?.publicationData?.uid
    };

    const formattedGalleryImages = book.images.map(imgUrl => ({ uri: imgUrl }));

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFavorited, setIsFavorited] = useState(false);

    // Map States
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [seller, setSeller] = useState({
        name: passedSeller?.name || 'Loading...',
        rating: passedSeller?.rating || 0,
        reviews: passedSeller?.reviews || 0,
        avatarUrl: passedSeller?.avatarUrl || null,
        meetingLocations: []
    });

    const mapRef = useRef(null);

    useEffect(() => {
        if (mapRef.current && seller.meetingLocations.length > 0) {
            setTimeout(() => {
                if (seller.meetingLocations.length === 1) {
                    mapRef.current.animateToRegion({
                        latitude: seller.meetingLocations[0].latitude,
                        longitude: seller.meetingLocations[0].longitude,
                        latitudeDelta: 0.06, 
                        longitudeDelta: 0.06,
                    }, 1000); 
                } else {
                    mapRef.current.fitToCoordinates(seller.meetingLocations, {
                        edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
                        animated: true,
                    });
                }
            }, 500); 
        }
    }, [seller.meetingLocations]);

    const handleScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / width);
        setCurrentImageIndex(index);
    };

    // Sync Favorite Icon State
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (!currentUser || !bookId) return;

            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    const favorites = userData.favoriteBooks || [];
                    setIsFavorited(favorites.includes(bookId));
                }
            } catch (error) {
                console.error('[BookDetailsScreen] Failed to verify user favorite records:', error);
            }
        };

        checkFavoriteStatus();
    }, [bookId, currentUser]);

    // Retrieve Seller Profile Data & Meeting Locations
    useEffect(() => {
        const fetchSellerProfile = async () => {
            if (!book.uid) {
                console.warn('[BookDetailsScreen] Missing seller identifier (UID).');
                return;
            }

            try {
                const sellerDocRef = doc(db, 'users', book.uid);
                const sellerDocSnap = await getDoc(sellerDocRef);

                if (sellerDocSnap.exists()) {
                    const sellerData = sellerDocSnap.data();

                    const fetchedAvatar = sellerData.photoURL || 
                        sellerData.profilePicture || 
                        sellerData.profilePic || 
                        sellerData.avatar;

                    const displayName = sellerData.username || 
                        sellerData.fullName || 
                        sellerData.name || 
                        'Anonymous Swapper';

                    // Helper function to geocode an address string
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
                            console.warn(`[BookDetailsScreen] Geocoding failed for ${pinTitle}:`, error);
                        }
                        return null;
                    };

                    const addressData = sellerData.institutionalAddress;
                    const geocodePromises = [];

                    if (addressData) {
                        const city = addressData.city || '';
                        const country = addressData.country || 'Portugal';
                        const cityCountry = `${city}, ${country}`.trim();

                        // 1. Process and clean Address Line 1
                        let address1String = addressData.addressLine1 || '';
                        address1String = address1String.replace(/n(?:º)?\s*(\d+)/i, 'nº $1'); // Normalizes formats like "n12" to "nº 12"
                        
                        if (address1String && !address1String.toLowerCase().includes(city.toLowerCase())) {
                            address1String = `${address1String}, ${cityCountry}`;
                        }

                        if (addressData.addressLine1) {
                            geocodePromises.push(getGeocodedPin(address1String, 'primary_loc', 'Primary Location'));
                        }

                        // 2. Process Address Line 2 with native Postal Code pattern matching
                        if (addressData.addressLine2) {
                            let address2String = addressData.addressLine2;
                            
                            // Detects if the string already contains a valid Portuguese postal code (e.g., 1549-003)
                            const hasPostalCode = /\d{4}-\d{3}/.test(address2String);
                            const hasCountry = address2String.toLowerCase().includes('portugal');

                            if (!hasCountry) {
                                if (hasPostalCode) {
                                    // If a postal code is present, treat it as complete and just append the country
                                    address2String = `${address2String}, Portugal`;
                                } else {
                                    // If it's a generic backup entry, mix it with profile regional fields
                                    address2String = `${address2String}, ${cityCountry}`;
                                }
                            }

                            geocodePromises.push(getGeocodedPin(address2String, 'secondary_loc', 'Alternative Location'));
                        }
                    }

                    // Execute requests in parallel
                    const resolvedPins = await Promise.all(geocodePromises);
                    
                    // Filter out failed promises
                    let mappedLocations = resolvedPins.filter(pin => pin !== null);

                    // Safety fallback map coordinates
                    if (mappedLocations.length === 0) {
                        mappedLocations = [
                            { id: 'default', title: 'Location Unavailable', latitude: 38.6611, longitude: -9.2058, address: 'No registered address' }
                        ];
                    }

                    setSeller({
                        name: displayName,
                        rating: sellerData.rating || 0, 
                        reviews: sellerData.reviewCount || 0, 
                        avatarUrl: fetchedAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=EACCA5&color=333`,
                        meetingLocations: mappedLocations
                    });
                } else {
                    console.warn(`[BookDetailsScreen] Document not found for UID: ${book.uid}`);
                    setSeller(prev => ({ ...prev, name: 'Unknown User' }));
                }
            } catch (error) {
                console.error('[BookDetailsScreen] Failed to retrieve seller profile:', error);
                setSeller(prev => ({ ...prev, name: 'Error loading user' }));
            }
        };

        fetchSellerProfile();
    }, [book.uid]);

    const handleToggleFavorite = async () => {
        if (!currentUser) {
            console.warn('[BookDetailsScreen] Guest operations restricted.');
            return;
        }
        if (!bookId) return;

        const baselineState = isFavorited;
        setIsFavorited(!baselineState);

        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const publicationDocRef = doc(db, 'publications', bookId); 

            await Promise.all([
                updateDoc(userDocRef, {
                    favoriteBooks: !baselineState ? arrayUnion(bookId) : arrayRemove(bookId)
                }),
                updateDoc(publicationDocRef, {
                    "stats.likesCount": increment(!baselineState ? 1 : -1)
                })
            ]);
        } catch (error) {
            console.error('[BookDetailsScreen] Database error handling favorites:', error);
            setIsFavorited(baselineState); 
        }
    };

    const handleNavigate = (location) => {
        const { latitude, longitude } = location;

        const wazeUrl = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;

        const nativeMapUrl = Platform.select({
            ios: `maps:${latitude},${longitude}?q=${latitude},${longitude}`,
            android: `google.navigation:q=${latitude},${longitude}`
        });

        Alert.alert(
            "Get Directions",
            "How would you prefer to get to this location?",
            [
                { 
                    text: "Waze", 
                    onPress: () => Linking.openURL(wazeUrl).catch(() => Alert.alert("Error", "Waze does not seem to be installed.")) 
                },
                { 
                    text: Platform.OS === 'ios' ? "Apple Maps" : "Google Maps", 
                    onPress: () => Linking.openURL(nativeMapUrl).catch(() => Alert.alert("Error", "Could not open the native maps application."))
                },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const handleAcceptLocation = (location) => {
        Alert.alert(
            "Location Accepted",
            `You chose to meet at: ${location.title}. You can confirm details inside the chat.`,
            [
                { text: "Go to Chat", onPress: () => {} },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const handleProposeAlternative = () => {
        Alert.alert(
            "Propose Alternative",
            "Would you like to suggest a different meeting location to the seller?",
            [
                { text: "Suggest via Chat", onPress: () => {} },
                { text: "Back", style: "cancel" }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* --- HEADER IMAGE CAROUSEL & BUTTONS --- */}
                <View style={styles.imageContainer}>
                    <ScrollView 
                        horizontal 
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    >
                        {book.images.map((imgUrl, index) => (
                            <View key={index} style={styles.singleImageWrapper}>
                                <TouchableWithoutFeedback onPress={() => setIsGalleryVisible(true)}>
                                    <View style={{ width: '100%', height: '100%' }}>
                                        <Image
                                            source={{ uri: imgUrl }}
                                            style={styles.bookImage}
                                            contentFit="cover"
                                            transition={300}
                                            cachePolicy="memory-disk"
                                        />
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>
                        ))}
                    </ScrollView>

                    {book.images.length > 1 && (
                        <View style={styles.paginationContainer}>
                            {book.images.map((_, index) => (
                                <View 
                                    key={index} 
                                    style={[
                                        styles.dot, 
                                        currentImageIndex === index && styles.activeDot
                                    ]} 
                                />
                            ))}
                        </View>
                    )}

                    <SafeAreaView edges={['top']} style={styles.topButtonsContainer}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
                            <Iconify icon="lucide:arrow-left" size={24} color="#FFFFFF" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.iconButton} onPress={handleToggleFavorite}>
                            <Iconify 
                                icon={isFavorited ? "mdi:cards-heart" : "mdi:cards-heart-outline"} 
                                size={24} 
                                color={isFavorited ? theme.heart : theme.pureWhite} 
                            />
                        </TouchableOpacity>
                    </SafeAreaView>
                </View>

                {/* --- BOOK DETAILS --- */}
                <View style={styles.detailsContainer}>
                    <Text style={styles.title}>{book.title}</Text>
                    <Text style={styles.author}>{book.author}</Text>

                    {/* --- SUBJECT & CONDITION BOXES --- */}
                    <View style={styles.infoBoxesContainer}>
                        <View style={[styles.infoBox, { marginRight: 8 }]}>
                            <Text style={styles.infoBoxLabel}>Subject</Text>
                            <Text style={styles.infoBoxValue}>{book.subject}</Text>
                        </View>

                        <View style={[styles.infoBox, { marginLeft: 8 }]}>
                            <Text style={styles.infoBoxLabel}>Condition</Text>
                            <Text style={styles.infoBoxValue}>{book.condition}</Text>
                        </View>
                    </View>

                    <Text style={styles.description}>{book.description}</Text>

                    {/* --- SELLER CARD --- */}
                    <TouchableOpacity style={styles.sellerCard}>
                        <View style={styles.sellerInfoLeft}>
                            <Image 
                                source={seller.avatarUrl ? { uri: seller.avatarUrl } : null} 
                                style={[styles.sellerAvatar, { backgroundColor: '#EACCA5' }]}
                                contentFit="cover"
                                transition={200}
                                cachePolicy="memory-disk"
                            />
                            <View>
                                <Text style={styles.sellerName}>{seller.name}</Text>
                                <View style={styles.ratingContainer}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Iconify 
                                            key={star} 
                                            icon={star <= Math.round(seller.rating) ? "mdi:star" : "mdi:star-outline"} 
                                            size={14} 
                                            color="#E58A1F" 
                                            style={styles.starIcon} 
                                        />
                                    ))}
                                    <Text style={styles.reviewsCount}>
                                        {seller.reviews > 0 ? `(${seller.reviews})` : 'No reviews yet'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <Iconify icon="lucide:chevron-right" size={20} color="#333333" />
                    </TouchableOpacity>

                    {/* --- MAP SECTION --- */}
                    <Text style={inlineMapStyles.sectionTitle}>Suggested Meeting Locations</Text>
                    <Text style={inlineMapStyles.sectionSubtitle}>Select a pin to accept the location or offer an alternative</Text>

                    <View style={inlineMapStyles.mapWrapper}>
                        <MapView
                            ref={mapRef}
                            provider={PROVIDER_DEFAULT}
                            style={inlineMapStyles.map}
                            initialRegion={{
                                latitude: 38.6611,
                                longitude: -9.2058,
                                latitudeDelta: 0.04,
                                longitudeDelta: 0.04,
                            }}
                        >
                            {seller.meetingLocations.map((loc) => (
                                <Marker
                                    key={loc.id}
                                    coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                                    title={loc.title}
                                    description={loc.address}
                                    pinColor={selectedLocation?.id === loc.id ? "#E58A1F" : "#A35C37"}
                                    onPress={() => setSelectedLocation(loc)}
                                />
                            ))}
                        </MapView>
                    </View>

                    {/* Dynamic Action Card */}
                    {selectedLocation && (
                        <View style={[inlineMapStyles.actionCard, { borderColor: theme.border || '#eaeaea' }]}>
                            <View style={inlineMapStyles.actionTextContainer}>
                                <Text style={inlineMapStyles.actionLocationTitle}>{selectedLocation.title}</Text>
                                <Text style={inlineMapStyles.actionLocationSub}>{selectedLocation.address}</Text>
                            </View>

                            {/* --- DIRECTIONS ACTION TRIGGER BUTTON --- */}
                            <TouchableOpacity 
                                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
                                onPress={() => handleNavigate(selectedLocation)}
                            >
                                <Iconify icon="lucide:navigation" size={16} color="#E58A1F" />
                                <Text style={{ marginLeft: 6, color: '#E58A1F', fontWeight: '600', fontSize: 13 }}>
                                    Get directions to this location
                                </Text>
                            </TouchableOpacity>

                            <View style={inlineMapStyles.actionButtonsRow}>
                                <TouchableOpacity style={inlineMapStyles.inlineProposeButton} onPress={handleProposeAlternative}>
                                    <Text style={inlineMapStyles.inlineProposeText}>Propose Another</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[inlineMapStyles.inlineAcceptButton, { backgroundColor: '#A35C37' }]} onPress={() => handleAcceptLocation(selectedLocation)}>
                                    <Text style={inlineMapStyles.inlineAcceptText}>Accept Local</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* --- BOTTOM ACTION BUTTONS --- */}
            <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.chatButton}>
                        <Text style={styles.chatButtonText}>Chat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.offerButton}>
                        <Text style={styles.offerButtonText}>Make an Offer</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ImageViewing
                images={formattedGalleryImages}
                imageIndex={currentImageIndex}
                visible={isGalleryVisible}
                onRequestClose={() => setIsGalleryVisible(false)}
                swipeToCloseEnabled={true}
                doubleTapToZoomEnabled={true}
                ImageComponent={GalleryImageWrapper}
            />
        </View>
    );
}

const inlineMapStyles = StyleSheet.create({
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333333',
        marginTop: 24,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#666666',
        marginBottom: 12,
    },
    mapWrapper: {
        height: 260,
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EAEAEA',
        marginBottom: 12
    },
    map: {
        width: '100%',
        height: '100%'
    },
    actionCard: {
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#F9F9F9',
        borderWidth: 1,
        marginBottom: 16
    },
    actionTextContainer: {
        marginBottom: 12
    },
    actionLocationTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333333'
    },
    actionLocationSub: {
        fontSize: 12,
        color: '#666666',
        marginTop: 2
    },
    actionButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    inlineProposeButton: {
        flex: 1,
        paddingVertical: 10,
        marginRight: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#A35C37',
        alignItems: 'center',
        justifyContent: 'center'
    },
    inlineProposeText: {
        color: '#A35C37',
        fontSize: 13,
        fontWeight: '600'
    },
    inlineAcceptButton: {
        flex: 1,
        paddingVertical: 10,
        marginLeft: 6,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    inlineAcceptText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600'
    }
});
