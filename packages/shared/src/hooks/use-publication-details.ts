import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { fetchUserProfile, toggleFavoriteStatus } from '../services/users';

export function usePublicationDetails(book, initialSellerData) {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const [isFavorited, setIsFavorited] = useState(false);
    const [seller, setSeller] = useState({
        name: initialSellerData?.name || 'Loading...',
        rating: initialSellerData?.rating || 0,
        reviews: initialSellerData?.reviews || 0,
        avatarUrl: initialSellerData?.avatarUrl || null,
    });

    // 1. Check Favorite Status on Mount
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (!currentUser || !book.id) return;
            try {
                const userData = await fetchUserProfile(currentUser.uid);
                if (userData && userData.favoriteBooks) {
                    setIsFavorited(userData.favoriteBooks.includes(book.id));
                }
            } catch (error) {
                console.error('[usePublicationDetails] Failed to verify user favorite records:', error);
            }
        };
        checkFavoriteStatus();
    }, [book.id, currentUser]);

    // 2. Fetch Latest Seller Profile
    useEffect(() => {
        const loadSellerProfile = async () => {
            if (!book.uid) return;
            try {
                const sellerData = await fetchUserProfile(book.uid);
                if (sellerData) {
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
                console.error('[usePublicationDetails] Failed to retrieve seller profile:', error);
            }
        };
        loadSellerProfile();
    }, [book.uid]);

    // 3. Handle Favorite Mutation (Optimistic Update)
    const handleToggleFavorite = async () => {
        if (!currentUser || !book.id) return;

        const baselineState = isFavorited;
        setIsFavorited(!baselineState); // Optimistic UI update

        try {
            await toggleFavoriteStatus(currentUser.uid, book.id, baselineState);
        } catch (error) {
            console.error('[usePublicationDetails] Failed to toggle favorite:', error);
            setIsFavorited(baselineState); // Rollback on failure
        }
    };

    return { seller, isFavorited, handleToggleFavorite };
}
