import React from 'react';
import { View, Text, TouchableOpacity, Linking, Platform, ActionSheetIOS, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Iconify } from 'react-native-iconify';

// 1. IMPORT YOUR AUTH HOOK (Adjust path to match your project's auth hook)
import { useAuth } from '@readme/shared/src/contexts/AuthContext';

import { PublicationInfoView } from '../../components/ui/PublicationInfoView';
import { GranularRating } from '../../components/ui/GranularRating';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { buildBookDetailsStyles } from '../../styles/publicationDetailsStyles';
import { usePublicationDetails } from '@readme/shared/src/hooks/use-publication-details';
import { UsersService } from '@readme/shared/src/services/users';
import { PublicationService } from '@readme/shared/src/services/publications';
import { useOffer } from '@readme/shared/src/contexts/OfferContext';
import { ReportModal } from '../../components/ui/ReportModal';

const extractBookDetails = (passedItem) => {
    const pubData = passedItem?.publicationData || passedItem || {};
    const details = PublicationService.normalizePublicationDetails(pubData);
    return {
        ...details,
        id: passedItem?.id || pubData.id || details.id,
        formattedGalleryImages: details.images.map(imgUrl => ({ uri: imgUrl })),
    };
};

export default function PublicationDetailsScreen({ route, navigation }) {
    const theme = useTheme();
    const styles = buildBookDetailsStyles(theme);

    // 2. GET LOGGED-IN USER ID
    const { currentUser } = useAuth(); // or whatever gives you the current logged-in user
    const currentUserId = currentUser?.uid;

    const passedData = route?.params?.publication;
    const book = extractBookDetails(passedData);
    const passedSeller = route?.params?.seller;

    // 3. CHECK IF THIS IS YOUR OWN BOOK
    const isMyBook = Boolean(currentUserId && book?.ownerId === currentUserId);

    // 4. DEFINE FLAGS (Guarantees hideOwnerProfile exists so no ReferenceError occurs)
    const hideOwnerProfile = route?.params?.hideOwnerProfile || false;
    const hideOfferButton = route?.params?.hideOfferButton || isMyBook;
    
    // HIDE SELLER CARD IF EXPLICITLY requested OR IF IT'S YOUR OWN BOOK
    const hideSellerCard = route?.params?.hideSellerCard || isMyBook;

    const { seller, isFavorited, handleToggleFavorite, handleReportPublication, reportModal, canReport, canContactDirectly, sellerPhoneNumber } = usePublicationDetails(book, passedSeller);

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

    const handleCallOrSms = () => {
        if (!sellerPhoneNumber) return;
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    title: 'Contacto telefónico',
                    message: sellerPhoneNumber,
                    options: ['Ligar', 'Enviar SMS', 'Cancelar'],
                    cancelButtonIndex: 2,
                },
                (buttonIndex) => {
                    if (buttonIndex === 0) Linking.openURL(`tel:${sellerPhoneNumber}`);
                    else if (buttonIndex === 1) Linking.openURL(`sms:${sellerPhoneNumber}`);
                }
            );
        } else {
            Alert.alert(
                'Contacto telefónico',
                sellerPhoneNumber,
                [
                    { text: 'Ligar', onPress: () => Linking.openURL(`tel:${sellerPhoneNumber}`) },
                    { text: 'Enviar SMS', onPress: () => Linking.openURL(`sms:${sellerPhoneNumber}`) },
                    { text: 'Cancelar', style: 'cancel' },
                ]
            );
        }
    };

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
        // AUTOMATICALLY RETURNS NULL IF IT IS YOUR BOOK
        if (hideSellerCard) return null;

        return (
            <View>
                <TouchableOpacity
                    style={styles.sellerCard}
                    disabled={hideOwnerProfile}
                    onPress={() => navigation.navigate(ROUTES.PUBLIC_PROFILE, { ownerId: book?.ownerId })}
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
                    {!hideOwnerProfile && (
                        <Iconify icon="lucide:chevron-right" size={20} color="#333333" />
                    )}
                </TouchableOpacity>

                {canContactDirectly && (
                    <TouchableOpacity
                        style={styles.contactButton}
                        onPress={handleCallOrSms}
                        activeOpacity={0.85}
                    >
                        <Iconify icon="lucide:phone-call" size={18} color={theme.primary} />
                        <Text style={styles.contactButtonText}>Ligar / SMS</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderBottomBar = () => {
        if (hideOfferButton) return null;
        return (
            <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.offerButton, canContactDirectly && { width: undefined, flex: 1 }]}
                        onPress={handleMakeOffer}
                        activeOpacity={0.85}
                    >
                        <Iconify icon="lucide:handshake" size={22} color="#FFFFFF" />
                        <Text style={styles.offerButtonText}>Make an Offer</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    };

    return (
        <>
            <PublicationInfoView
                book={book}
                topRightActions={renderTopActions()}
                sellerCard={renderSellerCard()}
                bottomBar={renderBottomBar()}
            />

            <ReportModal
                visible={reportModal?.visible}
                {...reportModal?.modalProps}
            />
        </>
    );
}
