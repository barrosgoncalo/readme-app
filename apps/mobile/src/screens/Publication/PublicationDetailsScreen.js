import React, { useState } from 'react'; 
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    StatusBar, 
    Dimensions, 
    useColorScheme,
    TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 

// External Libraries
import { Image } from 'expo-image';
import ImageViewing from 'react-native-image-viewing';
import { Iconify } from 'react-native-iconify';

// Internal Architecture Imports
import { GranularRating } from '../../components/ui/GranularRating';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { Colors } from '@readme/shared/src/constants/theme';
import { buildBookDetailsStyles } from '../../styles/publicationDetailsStyles';
import { GalleryImageWrapper } from '../../components/ui/GalleryImageWrapper';
import { usePublicationDetails } from '@readme/shared/src/hooks/use-publication-details';
import { PublicationService } from '@readme/shared/src/services/publications';

const { width } = Dimensions.get('window');

// ==========================================
// HELPER FUNCTIONS
// ==========================================
const extractBookDetails = (passedItem) => {
    const pubData = passedItem?.publicationData || passedItem || {};

    const details = PublicationService.normalizePublicationDetails(pubData);

    return {
        ...details,
        formattedGalleryImages: details.images.map(imgUrl => ({ uri: imgUrl })),
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

    // --- Route Parsing ---
    const passedData = route?.params?.publication;
    const book = extractBookDetails(passedData);
    const passedSeller = route?.params?.seller;

    const hideOfferButton = route?.params?.hideOfferButton || false;
    const hideSellerCard = route?.params?.hideSellerCard || false;

    // --- Data & Logic Layer ---
    const { seller, isFavorited, handleToggleFavorite } = usePublicationDetails(book, passedSeller);

    // --- Visual State Layer ---
    const [isGalleryVisible, setIsGalleryVisible] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // ==========================================
    // EXTRACT LIVE SELLER METRICS SAFELY
    // ==========================================
    const sellerRating = Number(seller?.rating) || 0;
    const sellerReviewCount = Number(seller?.reviewCount ?? seller?.reviews) || 0;
    const sellerName = seller?.username || "Anonymous Swapper";
    const sellerAvatar = seller?.photoURL || null;

    // ==========================================
    // HANDLERS
    // ==========================================
    const handleScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / width);
        setCurrentImageIndex(index);
    };

    const handleMakeOffer = () => {
        const perfectlyCleanBook = {
            ...book,
            ownerName: sellerName,
            ownerAvatar: sellerAvatar
        };

        navigation.navigate(ROUTES.STEP_ONE_OFFER, { 
            targetBook: perfectlyCleanBook,
            targetSeller: seller
        });
    };

    // ==========================================
    // RENDER
    // ==========================================
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={[
                    styles.scrollContent,
                    hideOfferButton && { paddingBottom: 40 }
                ]}
            >                
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
                    {!hideSellerCard && (
                        <TouchableOpacity
                            style={styles.sellerCard}
                            onPress={() => navigation.navigate(ROUTES.PUBLIC_PROFILE_SCREEN, { 
                                ownerId: book?.ownerId
                            })}
                        >
                            <View style={styles.sellerInfoLeft}>
                                <Image 
                                    source={sellerAvatar ? { uri: sellerAvatar } : null} 
                                    style={[styles.sellerAvatar, { backgroundColor: '#EACCA5' }]} 
                                    contentFit="cover" 
                                />
                                <View>
                                    <Text style={styles.sellerName}>{sellerName}</Text>
                                    <View style={styles.ratingContainer}>
                                        <GranularRating rating={sellerRating} theme={theme} />
                                        <Text style={styles.reviewsCount}>
                                            {sellerReviewCount > 0 ? `(${sellerReviewCount})` : 'No reviews yet'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <Iconify icon="lucide:chevron-right" size={20} color="#333333" />
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {/* --- BOTTOM ACTION BUTTON --- */}
            {!hideOfferButton && (
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
            )}

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
