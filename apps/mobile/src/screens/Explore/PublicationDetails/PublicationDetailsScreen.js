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
import { ROUTES } from '@readme/shared/src/constants/routes';
import { Colors } from '@readme/shared/src/constants/theme';
import { buildBookDetailsStyles } from '../../../styles/publicationDetailsStyles';
import { Image } from 'expo-image';
import ImageViewing from 'react-native-image-viewing';
import { TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Iconify } from 'react-native-iconify';

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
                onLoad({ nativeEvent: { source: { width: e.source.width, height: e.source.height } } });
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

    // Simplified Seller State
    const [seller, setSeller] = useState({
        name: passedSeller?.name || 'Loading...',
        rating: passedSeller?.rating || 0,
        reviews: passedSeller?.reviews || 0,
        avatarUrl: passedSeller?.avatarUrl || null,
    });

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
                    setIsFavorited((userDocSnap.data().favoriteBooks || []).includes(bookId));
                }
            } catch (error) {
                console.error('[BookDetailsScreen] Failed to verify user favorite records:', error);
            }
        };
        checkFavoriteStatus();
    }, [bookId, currentUser]);

    // Fetch basic seller profile without map logic
    useEffect(() => {
        const fetchSellerProfile = async () => {
            if (!book.uid) return;

            try {
                const sellerDocRef = doc(db, 'users', book.uid);
                const sellerDocSnap = await getDoc(sellerDocRef);

                if (sellerDocSnap.exists()) {
                    const sellerData = sellerDocSnap.data();
                    const displayName = sellerData.username || sellerData.fullName || sellerData.name || 'Anonymous Swapper';
                    const fetchedAvatar = sellerData.photoURL || sellerData.profilePicture || sellerData.avatar;

                    setSeller({
                        name: displayName,
                        rating: sellerData.rating || 0, 
                        reviews: sellerData.reviewCount || 0, 
                        avatarUrl: fetchedAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=EACCA5&color=333`,
                    });
                }
            } catch (error) {
                console.error('[BookDetailsScreen] Failed to retrieve seller profile:', error);
            }
        };
        fetchSellerProfile();
    }, [book.uid]);

    const handleToggleFavorite = async () => {
        if (!currentUser || !bookId) return;
        const baselineState = isFavorited;
        setIsFavorited(!baselineState);

        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const publicationDocRef = doc(db, 'publications', bookId); 

            await Promise.all([
                updateDoc(userDocRef, { favoriteBooks: !baselineState ? arrayUnion(bookId) : arrayRemove(bookId) }),
                updateDoc(publicationDocRef, { "stats.likesCount": increment(!baselineState ? 1 : -1) })
            ]);
        } catch (error) {
            setIsFavorited(baselineState); 
        }
    };

    const handleMakeOffer = () => {
        navigation.navigate( ROUTES.STEP_ONE_OFFER, { 
            targetBook: book, 
            targetSeller: seller 
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* --- HEADER IMAGE CAROUSEL --- */}
                <View style={styles.imageContainer}>
                    <ScrollView 
                        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll} scrollEventThrottle={16}
                    >
                        {book.images.map((imgUrl, index) => (
                            <View key={index} style={styles.singleImageWrapper}>
                                <TouchableWithoutFeedback onPress={() => setIsGalleryVisible(true)}>
                                    <View style={{ width: '100%', height: '100%' }}>
                                        <Image source={{ uri: imgUrl }} style={styles.bookImage} contentFit="cover" transition={300} />
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>
                        ))}
                    </ScrollView>

                    {book.images.length > 1 && (
                        <View style={styles.paginationContainer}>
                            {book.images.map((_, index) => (
                                <View key={index} style={[styles.dot, currentImageIndex === index && styles.activeDot]} />
                            ))}
                        </View>
                    )}

                    <SafeAreaView edges={['top']} style={styles.topButtonsContainer}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
                            <Iconify icon="lucide:arrow-left" size={24} color="#FFFFFF" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.iconButton} onPress={handleToggleFavorite}>
                            <Iconify icon={isFavorited ? "mdi:cards-heart" : "mdi:cards-heart-outline"} size={24} color={isFavorited ? theme.heart : theme.pureWhite} />
                        </TouchableOpacity>
                    </SafeAreaView>
                </View>

                {/* --- BOOK DETAILS --- */}
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
                            <Image source={seller.avatarUrl ? { uri: seller.avatarUrl } : null} style={[styles.sellerAvatar, { backgroundColor: '#EACCA5' }]} contentFit="cover" />
                            <View>
                                <Text style={styles.sellerName}>{seller.name}</Text>
                                <View style={styles.ratingContainer}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Iconify key={star} icon={star <= Math.round(seller.rating) ? "mdi:star" : "mdi:star-outline"} size={14} color="#E58A1F" style={styles.starIcon} />
                                    ))}
                                    <Text style={styles.reviewsCount}>{seller.reviews > 0 ? `(${seller.reviews})` : 'No reviews yet'}</Text>
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
