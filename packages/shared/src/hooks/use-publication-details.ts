import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { fetchUserProfile, toggleFavoriteStatus } from '../services/users';

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
                // 🪙 Forçamos o 'as any' aqui para o TS ignorar a falta do 'favoriteBooks' no tipo do serviço
                const userData = await fetchUserProfile(currentUser.uid) as any;
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
                const sellerData = await fetchUserProfile(sellerId) as any;
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
            await toggleFavoriteStatus(currentUser.uid, book.id, baselineState);
        } catch (error) {
            console.error('[usePublicationDetails] Failed to toggle favorite:', error);
            setIsFavorited(baselineState);
        }
    };

    return { seller, isFavorited, handleToggleFavorite };
}
