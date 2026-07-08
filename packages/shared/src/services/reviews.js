import { DB } from './DB'; 
import { fetchUserProfile } from './users';

/**
 * Vai buscar todas as reviews recebidas por um utilizador específico.
 * @param {string} revieweeId - O ID do utilizador alvo.
 * @returns {Promise<Array>} Array com as reviews e dados do autor.
 */
export const fetchUserReviews = async (revieweeId) => {
    try {
        const reviews = await DB.get('reviews', [
            { field: 'revieweeId', operator: '==', value: revieweeId }
        ]);
        
        const reviewsPromises = reviews.map(async (reviewData) => {
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
                ...reviewData,
                authorName
            };
        });

        const resolvedReviews = await Promise.all(reviewsPromises);
        
        return resolvedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }
};
