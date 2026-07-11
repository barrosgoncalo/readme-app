import { DB } from './DB';
import { PUBLICATION_STATUS } from '@readme/shared/src/constants/status';
import { createPublicationModel } from '../models/publication';
import { UsersService } from './users'; 
import { StorageService } from './storage';

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

    createPublication: async (currentUser, formData, images) => {
        if (!currentUser?.uid) throw new Error('Authentication required to create a publication.');
        if (!images || images.length === 0) throw new Error('At least one image is required.');

        const timestamp = Date.now();
        const publicationId = `${currentUser.uid}_${timestamp}`;
        const bookId = `book_${formData.bookName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${timestamp}`;

        let imageUrls;
        try {
            imageUrls = await StorageService.uploadImages(images, `books/${publicationId}`);
        } catch (error) {
            error.stage = 'storage';
            throw error;
        }

        const sellerName = UsersService.getDisplayName(currentUser);
        const sellerAvatar = UsersService.getAvatarUrl(currentUser);

        const publicationData = createPublicationModel(
            currentUser.uid,
            sellerName,
            sellerAvatar,
            {
                title: formData.bookName,
                author: formData.authorName || 'Unknown Author',
                images: imageUrls,
                bookId,
                condition: formData.condition,
                subject: formData.subject,
            },
            formData.description
        );

        try {
            await DB.create('publications', publicationData, publicationId);
        } catch (error) {
            error.stage = 'firestore';
            throw error;
        }

        return { id: publicationId, ...publicationData };
    },

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

    fetchExplorePublications: async (currentUserUid, blockedUids = []) => {
        const docs = await DB.getOrderedBy(
            'publications',
            { field: 'createdAt', direction: 'desc' },
            [],
            { source: 'server' }
        );

        return docs
            .map(_mapPublicationSummary)
            .filter(book =>
                book.ownerId !== currentUserUid &&
                    !blockedUids.includes(book.ownerId) &&
                    book.publicationData?.status === PUBLICATION_STATUS.AVAILABLE
            );
    },
}
