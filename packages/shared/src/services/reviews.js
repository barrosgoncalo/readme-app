import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { fetchUserProfile } from './users';
import { createReviewModel } from '../models/review';

/**
 * Vai buscar todas as reviews recebidas por um utilizador específico.
 * @param {string} revieweeId - O ID do utilizador alvo.
 * @returns {Promise<Array>} Array com as reviews e dados do autor.
 */
export const fetchUserReviews = async (revieweeId) => {
    try {
        // Assume que a tua coleção no Firestore se chama 'reviews'
        const q = query(
            collection(db, 'reviews'),
            where('revieweeId', '==', revieweeId)
        );
        
        const snapshot = await getDocs(q);
        const reviewsPromises = snapshot.docs.map(async (doc) => {
            const reviewData = doc.data();
            
            // Opcional mas recomendado: Ir buscar o perfil de quem fez a review para mostrar o nome/foto
            let authorName = "Unknown User";
            try {
                const reviewerProfile = await fetchUserProfile(reviewData.reviewerId);
                if (reviewerProfile && reviewerProfile.username) {
                    authorName = reviewerProfile.username;
                }
            } catch (err) {
                console.log("Could not fetch reviewer profile for:", reviewData.reviewerId);
            }

            return {
                id: doc.id,
                ...reviewData,
                authorName // Injetamos o nome resolvido para facilitar na UI
            };
        });

        const resolvedReviews = await Promise.all(reviewsPromises);

        // Ordenar da mais recente para a mais antiga
        return resolvedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }
};

/**
 * Checks whether reviewerId has already reviewed this swap.
 */
export const hasUserReviewed = async (swapId, reviewerId) => {
    const snap = await getDocs(query(collection(db, 'reviews'),
        where('swapId', '==', swapId), where('reviewerId', '==', reviewerId)));
    return !snap.empty;
};

/**
 * Submit a review for a completed swap. Guards against duplicate reviews.
 */
export const submitReview = async (swapId, chatId, reviewerId, revieweeId, rating, comment = '') => {
    const dup = await getDocs(query(collection(db, 'reviews'),
        where('swapId', '==', swapId), where('reviewerId', '==', reviewerId)));
    if (!dup.empty) throw new Error('You have already reviewed this swap.');
    await addDoc(collection(db, 'reviews'),
        createReviewModel(swapId, chatId, reviewerId, revieweeId, rating, comment));
};
