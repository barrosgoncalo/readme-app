import React from 'react';
import { View, Text, TouchableOpacity} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Iconify } from 'react-native-iconify';

// Internal Architecture Imports
import { PublicationInfoView } from '../../components/ui/PublicationInfoView';
import { GranularRating } from '../../components/ui/GranularRating';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { buildBookDetailsStyles } from '../../styles/publicationDetailsStyles';
import { usePublicationDetails } from '@readme/shared/src/hooks/use-publication-details';

import { UsersService } from '@readme/shared/src/services/users';
import { PublicationService } from '@readme/shared/src/services/publications';

import { useOffer } from '@readme/shared/src/contexts/OfferContext';

const extractBookDetails = (passedItem) => {
    const pubData = passedItem?.publicationData || passedItem || {};
    const details = PublicationService.normalizePublicationDetails(pubData);
    return {
        ...details,
        id: passedItem?.id || pubData.id || details.id,
        formattedGalleryImages: details.images.map(imgUrl => ({ uri: imgUrl })),
    };
};

/**
 * @typedef {Object} PublicationDetailsParams
 * @property {Object} publication - Required. A publication summary or raw doc
 *   (either shape is normalized via PublicationService.normalizePublicationDetails).
 * @property {Object} [seller] - Optional. Seller profile data ({ username, photoURL, rating, ... }).
 *   Pass when available to avoid a loading flash; PublicationDetailsScreen will
 *   fetch it independently via usePublicationDetails if omitted.
 * @property {boolean} [hideOfferButton] - Optional. Hides "Make an Offer" (e.g. viewing your own listing via a public route).
 * @property {boolean} [hideSellerCard] - Optional. Hides the seller card (e.g. public-profile context where it's redundant).
 */
export default function PublicationDetailsScreen({ route, navigation }) {
    const theme = useTheme();
    const styles = buildBookDetailsStyles(theme);

    const passedData = route?.params?.publication;
    const book = extractBookDetails(passedData);
    const passedSeller = route?.params?.seller;

    // Flags for specific public context logic (e.g. public profile feed)
    const hideOfferButton = route?.params?.hideOfferButton || false;
    const hideSellerCard = route?.params?.hideSellerCard || false;

    const { seller, isFavorited, handleToggleFavorite, handleReportPublication, canReport } = usePublicationDetails(book, passedSeller);

    const sellerRating = Number(seller?.rating) || 0;
    const sellerReviewCount = Number(seller?.reviewCount ?? seller?.reviews) || 0;
    const sellerName = UsersService.getDisplayName(seller);
    const sellerAvatar = UsersService.getAvatarUrl(seller);

    const { startOffer } = useOffer();

    const handleMakeOffer = () => {
        const perfectlyCleanBook = {
            ...book,
            ownerName: sellerName,
            ownerAvatar: sellerAvatar
        };

        startOffer(perfectlyCleanBook, seller);

        navigation.navigate(ROUTES.STEP_ONE_OFFER);
    };

// --- Compose UI Parts ---
    const renderTopActions = () => (
        <>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
                <Iconify icon="lucide:arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
                {canReport && (
                    <TouchableOpacity style={styles.iconButton} onPress={handleReportPublication}>
                        <Iconify icon="lucide:flag" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.iconButton} onPress={handleToggleFavorite}>
                    <Iconify
                        icon={isFavorited ? "mdi:cards-heart" : "mdi:cards-heart-outline"}
                        size={24}
                        color={isFavorited ? theme.heart : theme.pureWhite}
                    />
                </TouchableOpacity>
            </View>
        </>
    );
    const renderSellerCard = () => {
        if (hideSellerCard) return null;
        return (
            <TouchableOpacity
                style={styles.sellerCard}
                onPress={() => navigation.navigate(ROUTES.PUBLIC_PROFILE_SCREEN, { ownerId: book?.ownerId })}
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
        );
    };

    const renderBottomBar = () => {
        if (hideOfferButton) return null;
        return (
            <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
                <TouchableOpacity style={styles.offerButton} onPress={handleMakeOffer} activeOpacity={0.85}>
                    <Iconify icon="lucide:handshake" size={22} color="#FFFFFF" />
                    <Text style={styles.offerButtonText}>Make an Offer</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    };

    return (
        <PublicationInfoView 
            book={book}
            topRightActions={renderTopActions()}
            sellerCard={renderSellerCard()}
            bottomBar={renderBottomBar()}
        />
    );
}