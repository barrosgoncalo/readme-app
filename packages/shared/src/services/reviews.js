// @readme/shared/src/services/reviews.js
import { DB } from './DB';

export const ReviewService = {
    fetchUserReviews : async (revieweeId) => {
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
    },

    subscribeToReviewStatus: (chatId, userId, callback) => {
        if (!chatId || !userId) return () => {};

        return DB.subscribeQuery(
            'reviews', 
            [
                { field: 'chatId', operator: '==', value: chatId },
                { field: 'reviewerId', operator: '==', value: userId }
            ],
            (matchingReviews) => callback(matchingReviews.length > 0),
            (error) => console.error(`Error streaming review status:`, error)
        );
    }
};
