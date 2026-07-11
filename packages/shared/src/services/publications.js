import { DB } from './DB';
import { collection, getDocs, query, orderBy, doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db } from '@readme/shared/src/services/firebase';
import { PUBLICATION_STATUS } from '@readme/shared/src/constants/status';

// ==========================================
// PRIVATE AUXILIARY HELPERS
// ==========================================

const _mapPublicationSummary = (doc) => ({
    id: doc.id,
    title: doc.book?.title || 'Unknown Title',
    author: doc.book?.author || 'Unknown Author',
    imageUrl: (doc.book?.images?.length > 0 ? doc.book.images[0] : 'https://via.placeholder.com/400x600'),
    ownerId: doc.uid,
    seller: {
        name: doc.sellerName || doc.ownerName || 'Anonymous Swapper',
        avatarUrl: doc.sellerAvatar || doc.ownerAvatar || null,
    },
    favoriteCount: doc.stats?.likesCount || 0,
    publicationData: doc,
});

const _mapPublicationDetails = (doc) => ({
    ..._mapPublicationSummary(doc),
    images: doc.book?.images?.length > 0 ? doc.book.images : ['https://via.placeholder.com/400x600'],
    description: doc.detailsText || "No description provided for this book.",
    condition: doc.book?.condition || 'Condition not specified',
    subject: doc.book?.subject || 'Not specified',
    rawDocData: doc,
});

// ==========================================
// EXPORTED SERVICE
// ==========================================

export const PublicationService = {

    /**
     * Fetches a single publication by its unique document ID
     */
    fetchPublication : async (bookId) => {
        try {
            if (!bookId) return null;
            return await DB.get('publications', bookId);
        } catch (error) {
            console.error("ERROR FETCHING SINGLE PUBLICATION:", error.message || error);
            throw error;
        }
    },

    /**
     * Fetches all books belonging to a specific user UID
     */
    fetchUserPublications: async (userId) => {
        const docs = await DB.get('publications', [
            { field: 'uid', operator: '==', value: userId }
        ]);
        return docs.map(_mapPublicationSummary);
    },

    fetchPublicationsByIds: async (ids) => {
        if (!ids || ids.length === 0) return [];

        const docs = await Promise.all(
            ids.map(id => PublicationService.fetchPublication(id))
        );

        return docs
            .filter(Boolean)
            .map(_mapPublicationSummary);
    },

    normalizePublicationDetails: (doc) => _mapPublicationDetails(doc),

    /**
     * Fetches all available publications for the explore feed, filtering out the current user and blocked users.
     */
    fetchExplorePublications : async (currentUserUid, blockedUids = []) => {
        try {
            const q = query(collection(db, 'publications'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    uid: data.uid,
                    title: data.book?.title || 'Unknown Title',
                    author: data.book?.author || 'Unknown Author',
                    imageUrl: data.book?.images && data.book.images.length > 0 
                        ? data.book.images[0] 
                        : null,
                    seller: {
                        name: data.sellerName || data.ownerName || 'Anonymous Swapper',
                        avatarUrl: data.sellerAvatar || data.ownerAvatar || null,
                    },
                    favoriteCount: data.stats?.likesCount || 0,
                    publicationData: data
                };
            }).filter(book =>
                book.uid !== currentUserUid &&
                !blockedUids.includes(book.uid) &&
                book.publicationData?.status === PUBLICATION_STATUS.AVAILABLE
            );
        } catch (error) {
            console.error("ERROR FETCHING EXPLORE PUBLICATIONS:", error);
            throw error;
        }
    },

    /**
     * Toggles a publication's favorite status for a user, updating both the user's list and the book's like count.
     */
    toggleFavorite : async (userId, bookId, isCurrentlyFavorite) => {
        try {
            const userDocRef = doc(db, 'users', userId); 
            const publicationDocRef = doc(db, 'publications', bookId);

            await Promise.all([
                updateDoc(userDocRef, {
                    favoriteBooks: !isCurrentlyFavorite ? arrayUnion(bookId) : arrayRemove(bookId)
                }),
                updateDoc(publicationDocRef, {
                    "stats.likesCount": increment(!isCurrentlyFavorite ? 1 : -1)
                })
            ]);
            
            return { success: true };
        } catch (error) {
            console.error("ERROR TOGGLING FAVORITE:", error);
            throw error;
        }
    },
}
