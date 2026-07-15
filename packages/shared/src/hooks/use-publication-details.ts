import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import { UsersService } from '../services/users';
import { ReportsService } from '../services/reports';
import { REPORT_TARGET_TYPE, REPORT_REASON_LABELS } from '../constants/status';

export function usePublicationDetails(book: any, initialSellerData: any) {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const [isFavorited, setIsFavorited] = useState(false);

    // Mapeamento defensivo: passamos ambos os formatos para o ecrã não quebrar
    const [seller, setSeller] = useState({
        name: initialSellerData?.username || initialSellerData?.name || 'Loading...',
        username: initialSellerData?.username || initialSellerData?.name || 'Loading...', // <-- O teu ecrã lê isto
        rating: Number(initialSellerData?.rating) || 0,
        reviews: Number(initialSellerData?.reviewCount || initialSellerData?.reviews) || 0,
        reviewCount: Number(initialSellerData?.reviewCount || initialSellerData?.reviews) || 0,
        avatarUrl: initialSellerData?.photoURL || initialSellerData?.avatarUrl || null,
        photoURL: initialSellerData?.photoURL || initialSellerData?.avatarUrl || null, // <-- O teu ecrã lê isto
    });

    // 1. Check Favorite Status on Mount
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (!currentUser || !book?.id) return;
            try {
                const userData = await UsersService.fetchUserProfile(currentUser.uid) as any;
                if (userData && userData.favoriteBooks) {
                    setIsFavorited(userData.favoriteBooks.includes(book.id));
                }
            } catch (error) {
                console.error('[usePublicationDetails] Failed to verify user favorite records:', error);
            }
        };
        checkFavoriteStatus();
    }, [book?.id, currentUser]);

    // 2. Fetch Latest Seller Profile
    useEffect(() => {
        const loadSellerProfile = async () => {
            const sellerId = book?.ownerId || book?.uid;
            if (!sellerId) return;

            try {
                const sellerData = await UsersService.fetchUserProfile(sellerId) as any;
                if (sellerData) {
                    const displayName = sellerData.username || sellerData.fullName || sellerData.name || 'Anonymous Swapper';
                    const fetchedAvatar = sellerData.photoURL || sellerData.profilePicture || sellerData.avatar;

                    setSeller({
                        name: displayName,
                        username: displayName, // <-- Garante o nome no ecrã
                        rating: Number(sellerData.rating) || 0, 
                        reviewCount: Number(sellerData.reviewCount || sellerData.reviews) || 0,
                        reviews: Number(sellerData.reviewCount || sellerData.reviews) || 0, 
                        avatarUrl: fetchedAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=EACCA5&color=333`,
                        photoURL: fetchedAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=EACCA5&color=333`,
                    });
                }
            } catch (error) {
                console.error('[usePublicationDetails] Failed to retrieve seller profile:', error);
            }
        };
        loadSellerProfile();
    }, [book?.ownerId, book?.uid]);

    // 3. Handle Favorite Mutation (Optimistic Update)
    const handleToggleFavorite = async () => {
        if (!currentUser || !book?.id) return;

        const baselineState = isFavorited;
        setIsFavorited(!baselineState);

        try {
            await UsersService.toggleFavoriteStatus(currentUser.uid, book.id, baselineState);
        } catch (error) {
            console.error('[usePublicationDetails] Failed to toggle favorite:', error);
            setIsFavorited(baselineState);
        }
    };

    // 4. Report Publication
    const sellerId = book?.ownerId || book?.uid;
    const canReport = !!currentUser && !!book?.id && !!sellerId && sellerId !== currentUser.uid;

    const submitPublicationReport = async (reason: string) => {
        try {
            const snapshot = ReportsService.buildPublicationSnapshot(book);

            await ReportsService.submitReport(
                currentUser?.uid,
                REPORT_TARGET_TYPE.PUBLICATION,
                book?.id,
                sellerId,
                reason,
                snapshot
            );

            Alert.alert("Report Submitted", "Thanks — our team will review this listing.");
        } catch (error) {
            console.error('[usePublicationDetails] Failed to submit report:', error);
            Alert.alert("Something Went Wrong", "We couldn't submit your report. Please try again.");
        }
    };

    const handleReportPublication = () => {
        if (!currentUser) {
            Alert.alert("Error", "You must be logged in to report a listing.");
            return;
        }

        if (!canReport) {
            Alert.alert("Something Went Wrong", "We couldn't identify this listing. Please try again.");
            return;
        }

        Alert.alert(
            "Report Listing",
            "Why are you reporting this listing?",
            [
                { text: "Cancel", style: "cancel" },
                ...Object.entries(REPORT_REASON_LABELS).map(([reason, label]) => ({
                    text: label,
                    onPress: () => submitPublicationReport(reason)
                }))
            ]
        );
    };

    return { seller, isFavorited, handleToggleFavorite, handleReportPublication, canReport };
}