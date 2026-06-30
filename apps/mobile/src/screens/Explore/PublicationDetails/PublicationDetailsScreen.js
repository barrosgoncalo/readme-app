import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    StatusBar, 
    Dimensions, 
    useColorScheme
} from 'react-native';
import { TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 

// External Libraries
import { Image } from 'expo-image';
import ImageViewing from 'react-native-image-viewing';
import { Iconify } from 'react-native-iconify';

// Firebase Imports
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@readme/shared/src/services/firebase'; 

// Internal Architecture Imports
import { ROUTES } from '@readme/shared/src/constants/routes';
import { Colors } from '@readme/shared/src/constants/theme';
import { buildBookDetailsStyles } from '../../../styles/publicationDetailsStyles';
import { GalleryImageWrapper } from '../../../components/ui/GalleryImageWrapper';

const { width } = Dimensions.get('window');

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Safely extracts and normalizes book data from the messy route params.
 * Moving this outside the component prevents reallocation on every render.
 */
const extractBookDetails = (passedBook) => {
    const pubData = passedBook?.publicationData || {};
    const bookData = pubData.book || {};
    const images = bookData.images?.length > 0 ? bookData.images : ['https://via.placeholder.com/400x600'];

    return {
        id: passedBook?.id,
        uid: pubData.uid, // publisher's ID
        title: bookData.title || 'Unknown Title',
        author: bookData.author || 'Unknown Author',
        description: pubData.detailsText || "No description provided for this book.",
        condition: bookData.condition || 'Condition not specified',
        subject: bookData.subject || 'Not specified',
        images: images,
        formattedGalleryImages: images.map(imgUrl => ({ uri: imgUrl }))
    };
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function PublicationDetailsScreen({ route, navigation }) {
    // --- Theme & Styles ---
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildBookDetailsStyles(theme);

    // --- Authentication & Route Params ---
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const passedSeller = route?.params?.seller;
    
    // Parse the book data once using our helper
    const book = extractBookDetails(route?.params?.book);

    // --- Local State ---
    const [isGalleryVisible, setIsGalleryVisible] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFavorited, setIsFavorited] = useState(false);
    
    // Default seller state based on initial params, updates later via Firebase
    const [seller, setSeller] = useState({
        name: passedSeller?.name || 'Loading...',
        rating: passedSeller?.rating || 0,
        reviews: passedSeller?.reviews || 0,
        avatarUrl: passedSeller?.avatarUrl || null,
    });

    // ==========================================
    // EFFECTS
    // ==========================================

    // Check if the current user has this book in their favorites
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (!currentUser || !book.id) return;
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                
                if (userDocSnap.exists()) {
                    const favorites = userDocSnap.data().favoriteBooks || [];
                    setIsFavorited(favorites.includes(book.id));
                }
            } catch (error) {
                console.error('[BookDetailsScreen] Failed to verify user favorite records:', error);
            }
        };
        checkFavoriteStatus();
    }, [book.id, currentUser]);

    // Fetch the latest seller profile details from Firestore
    useEffect(() => {
        const fetchSellerProfile = async () => {
            if (!book.uid) return;

            try {
                const sellerDocRef = doc(db, 'users', book.uid);
                const sellerDocSnap = await getDoc(sellerDocRef);

                if (sellerDocSnap.exists()) {
                    const sellerData = sellerDocSnap.data();
                    
                    // Fallbacks for various name structures
                    const displayName = sellerData.username || sellerData.fullName || sellerData.name || 'Anonymous Swapper';
                    const fetchedAvatar = sellerData.photoURL || sellerData.profilePicture || sellerData.avatar;

                    setSeller({
                        name: displayName,
                        rating: sellerData.rating || 0, 
                        reviews: sellerData.reviewCount || 0, 
                        // Generate a placeholder avatar if they don't have one
                        avatarUrl: fetchedAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=EACCA5&color=333`,
                    });
                }
            } catch (error) {
                console.error('[BookDetailsScreen] Failed to retrieve seller profile:', error);
            }
        };
        fetchSellerProfile();
    }, [book.uid]);

    // ==========================================
    // HANDLERS
    // ==========================================

    // Tracks horizontal scrolling to update the pagination dots
    const handleScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / width);
        setCurrentImageIndex(index);
    };

    // Optimistically toggles the favorite state and updates Firestore
    const handleToggleFavorite = async () => {
        if (!currentUser || !book.id) return;
        
        // Save current state for rollback if network fails
        const baselineState = isFavorited;
        setIsFavorited(!baselineState); // Optimistic UI update

        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const publicationDocRef = doc(db, 'publications', book.id); 

            // Run both updates simultaneously
            await Promise.all([
                updateDoc(userDocRef, { 
                    favoriteBooks: !baselineState ? arrayUnion(book.id) : arrayRemove(book.id) 
                }),
                updateDoc(publicationDocRef, { 
                    "stats.likesCount": increment(!baselineState ? 1 : -1) 
                })
            ]);
        } catch (error) {
            console.error('[BookDetailsScreen] Failed to toggle favorite:', error);
            setIsFavorited(baselineState); // Rollback on failure
        }
    };

    // Proceeds to the offer flow, passing context forward
    const handleMakeOffer = () => {
        navigation.navigate(ROUTES.STEP_ONE_OFFER, { 
            targetBook: book, 
            targetSeller: seller
        });
    };

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* --- HEADER IMAGE CAROUSEL --- */}
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
                                        />
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Pagination Dots */}
                    {book.images.length > 1 && (
                        <View style={styles.paginationContainer}>
                            {book.images.map((_, index) => (
                                <View key={index} style={[styles.dot, currentImageIndex === index && styles.activeDot]} />
                            ))}
                        </View>
                    )}

                    {/* Floating Top Actions (Back / Favorite) */}
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

                {/* --- BOOK DETAILS & METADATA --- */}
                <View style={styles.detailsContainer}>
                    <Text style={styles.title}>{book.title}</Text>
                    <Text style={styles.author}>{book.author}</Text>

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
                </View>
            </ScrollView>

            {/* --- BOTTOM ACTION BUTTON --- */}
            <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
                <TouchableOpacity 
                    style={styles.offerButton} 
                    onPress={handleMakeOffer}
                    activeOpacity={0.85}
                >
                    <Iconify icon="lucide:handshake" size={22} color="#FFFFFF" />
                    <Text style={styles.offerButtonText}>Make an Offer</Text>
                </TouchableOpacity>
            </SafeAreaView>

            {/* --- FULLSCREEN IMAGE VIEWER MODAL --- */}
            <ImageViewing
                images={book.formattedGalleryImages}
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
