import { DB } from './DB';
import { UsersService } from './users';
import { createReviewModel } from '../models/review';

export const ReviewService = {
    fetchUserReviews: async (revieweeId) => {
        try {
            const reviews = await DB.get('reviews', [
                { field: 'revieweeId', operator: '==', value: revieweeId }
            ]);
            const reviewsPromises = reviews.map(async (reviewData) => {
                let authorName = "Unknown User";
                try {
                    const reviewerProfile = await UsersService.fetchSummaryUserProfile(reviewData.reviewerId);
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

    /**
     * One-shot check for whether reviewerId has already reviewed this swap.
     */
    hasUserReviewed: async (swapId, reviewerId) => {
        const matches = await DB.get('reviews', [
            { field: 'swapId', operator: '==', value: swapId },
            { field: 'reviewerId', operator: '==', value: reviewerId },
        ]);
        return matches.length > 0;
    },

    /**
     * Submit a review for a completed swap. Guards against duplicate reviews.
     */
    submitReview: async (swapId, chatId, reviewerId, revieweeId, rating, comment = '') => {
        const alreadyReviewed = await ReviewService.hasUserReviewed(swapId, reviewerId);
        if (alreadyReviewed) throw new Error('You have already reviewed this swap.');

        await DB.create('reviews', createReviewModel(swapId, chatId, reviewerId, revieweeId, rating, comment));
    },

    subscribeToReviewStatus: (swapId, userId, callback) => {
        if (!swapId || !userId) return () => {};
        return DB.subscribeQuery(
            'reviews',
            [
                { field: 'swapId', operator: '==', value: swapId },
                { field: 'reviewerId', operator: '==', value: userId }
            ],
            (matchingReviews) => callback(matchingReviews.length > 0),
            (error) => console.error(`Error streaming review status for swap "${swapId}":`, error)
        );
    },

    /**
     * Subscribes to the set of swapIds (message IDs) within a given chat
     * that this user has already reviewed.
     */
    subscribeToReviewedSwapsInChat: (chatId, userId, callback) => {
        if (!chatId || !userId) return () => {};
        return DB.subscribeQuery(
            'reviews',
            [
                { field: 'chatId', operator: '==', value: chatId },
                { field: 'reviewerId', operator: '==', value: userId }
            ],
            (matchingReviews) => callback(matchingReviews.map(r => r.swapId)),
            (error) => console.error(`Error streaming reviewed swaps for chat "${chatId}":`, error)
        );
    }
};
