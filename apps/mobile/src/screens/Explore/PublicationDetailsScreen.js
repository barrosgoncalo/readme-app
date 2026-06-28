import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    StatusBar,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Iconify } from 'react-native-iconify';

// Firebase Imports
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@readme/shared/src/services/firebase'; 

const { width } = Dimensions.get('window');

export default function BookDetailsScreen({ route, navigation }) {
    const passedBook = route?.params?.book;

    // 1. Safe book data mapping (Now grabbing the FULL array of images)
    const bookImages = passedBook?.publicationData?.book?.images?.length > 0 
        ? passedBook.publicationData.book.images 
        : ['https://via.placeholder.com/400x600']; // Fallback if no images exist

    const book = {
        title: passedBook?.publicationData?.book?.title || 'Unknown Title',
        author: passedBook?.publicationData?.book?.author || 'Unknown Author',
        description: passedBook?.publicationData?.detailsText || "No description provided for this book.",
        condition: passedBook?.publicationData?.book?.condition || 'Condition not specified',
        subject: passedBook?.publicationData?.book?.subject || 'Not specified',
        images: bookImages,
        // uid: passedBook?.publicationData?.uid
        uid: passedBook?.publicationData?.userId || passedBook?.publicationData?.uid || passedBook?.userId || passedBook?.uid || passedBook?.sellerId
    };

    // 2. State for the seller and active image dot
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [seller, setSeller] = useState({
        name: 'Loading...',
        rating: 0,
        reviews: 0,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=loading'
    });

    // Handle Image Swipe to update the dot indicator
    const handleScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / width);
        setCurrentImageIndex(index);
    };

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

                    // Resolve cross-platform naming conventions for user profiles
                    const fetchedAvatar = sellerData.photoURL || 
                        sellerData.profilePicture || 
                        sellerData.profilePic || 
                        sellerData.avatar;

                    const displayName = sellerData.username || 
                        sellerData.fullName || 
                        sellerData.name || 
                        'Anonymous Swapper';

                    setSeller({
                        name: displayName,
                        rating: sellerData.rating || 0, 
                        reviews: sellerData.reviewCount || 0, 
                        avatarUrl: fetchedAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=EACCA5&color=333`
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
                        scrollEventThrottle={16} // Fires smoothly during scroll
                    >
                        {book.images.map((imgUrl, index) => (
                            <View key={index} style={styles.singleImageWrapper}>
                                <Image
                                    source={{ uri: imgUrl }}
                                    style={[styles.bookImage, { objectFit: 'contain' }]}
                                    contentFit="contain"
                                />
                            </View>
                        ))}
                    </ScrollView>

                    {/* Pagination Dots (Only show if more than 1 image) */}
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
                        <TouchableOpacity 
                            style={styles.iconButton} 
                            onPress={() => navigation.goBack()}
                        >
                            <Iconify icon="lucide:arrow-left" size={24} color="#FFFFFF" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.iconButton}>
                            <Iconify icon="lucide:heart" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </SafeAreaView>
                </View>

                {/* --- BOOK DETAILS --- */}
                <View style={styles.detailsContainer}>
                    <Text style={styles.title}>{book.title}</Text>
                    <Text style={styles.author}>{book.author}</Text>

                    <Text style={styles.description}>
                        {book.description}
                    </Text>

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

                    {/* --- SELLER CARD --- */}
                    <TouchableOpacity style={styles.sellerCard}>
                        <View style={styles.sellerInfoLeft}>
                            <Image 
                                source={{ uri: seller.avatarUrl }} 
                                style={styles.sellerAvatar} 
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F4F2', 
    },
    scrollContent: {
        paddingBottom: 100, 
    },
    imageContainer: {
        width: width,
        height: 450,
        backgroundColor: '#EAEAEA', // Changed to a soft gray in case images have transparent/white backgrounds
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        position: 'relative',
    },
    singleImageWrapper: {
        width: width,
        height: 450,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookImage: {
        width: '100%',
        height: '100%',
    },
    paginationContainer: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#FFFFFF',
        width: 10,
        height: 10,
    },
    topButtonsContainer: {
        position: 'absolute',
        top: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    iconButton: {
        width: 44,
        height: 44,
        backgroundColor: 'rgba(92, 61, 46, 0.9)', 
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailsContainer: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    title: {
        fontSize: 26,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 8,
        textTransform: 'capitalize',
    },
    author: {
        fontSize: 18,
        color: '#888888',
        marginBottom: 20,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: '#8A8A8A',
        marginBottom: 24,
    },
    infoBoxesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    infoBox: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#8A8A8A',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    infoBoxLabel: {
        position: 'absolute',
        top: -10, 
        left: 16,
        backgroundColor: '#F5F4F2', 
        paddingHorizontal: 6,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333333',
    },
    infoBoxValue: {
        fontSize: 16,
        color: '#555555',
    },
    sellerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F5F4F2',
        borderWidth: 1,
        borderColor: '#DCD9D4',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    sellerInfoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sellerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EACCA5',
        marginRight: 12,
    },
    sellerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starIcon: {
        marginRight: 2,
    },
    reviewsCount: {
        fontSize: 12,
        color: '#888888',
        marginLeft: 6,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#F5F4F2',
        borderTopWidth: 1,
        borderColor: '#EAEAEA',
        paddingVertical: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chatButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#7A5B4C',
        borderRadius: 12,
        paddingVertical: 16,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5C3D2E',
    },
    offerButton: {
        flex: 1,
        backgroundColor: '#5C3D2E',
        borderRadius: 12,
        paddingVertical: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    offerButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
