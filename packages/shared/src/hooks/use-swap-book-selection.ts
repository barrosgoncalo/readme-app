import { useState, useEffect } from 'react';
import { PublicationService } from '@readme/shared/src/services/publications';

export function useSwapBookSelection(offeredBooks, routeParams, navigation, ROUTES) {
    const [selectedBookId, setSelectedBookId] = useState(null);
    const [fetchingBookId, setFetchingBookId] = useState(null);

    // Auto-skip to location step when there's only one offered book
    useEffect(() => {
        if (offeredBooks.length === 1) {
            const singleBook = offeredBooks[0];
            navigation.replace(ROUTES.SELECT_SWAP_LOCATION, {
                ...routeParams,
                selectedBookId: singleBook.id,
                selectedBookImage: singleBook.image || null
            });
        }
    }, [offeredBooks, navigation, routeParams]);

    const handleBookPress = async (bookId) => {
        if (!bookId || fetchingBookId) return;

        try {
            setFetchingBookId(bookId);
            const fullPublicationData = await PublicationService.fetchPublication(bookId);

            if (fullPublicationData) {
                navigation.navigate(ROUTES.PUBLICATION_DETAILS, {
                    publication: fullPublicationData,
                    hideOfferButton: true
                });
            } else {
                console.warn("Publication no longer exists!");
            }
        } catch (error) {
            console.error("Failed to fetch full book details:", error);
        } finally {
            setFetchingBookId(null);
        }
    };

    const handleNext = () => {
        if (!selectedBookId) return;
        const selectedBook = offeredBooks.find(b => b.id === selectedBookId);

        navigation.navigate(ROUTES.SELECT_SWAP_LOCATION, {
            ...routeParams,
            selectedBookId,
            selectedBookImage: selectedBook?.image || null
        });
    };

    return {
        selectedBookId,
        setSelectedBookId,
        fetchingBookId,
        handleBookPress,
        handleNext,
    };
}
