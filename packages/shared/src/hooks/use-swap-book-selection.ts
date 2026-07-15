import { useState, useEffect } from 'react';
import { PublicationService } from '@readme/shared/src/services/publications';
import { useCounterOffer } from '@readme/shared/src/contexts/CounterOfferContext';

export function useSwapBookSelection(offeredBooks, routeParams, navigation, ROUTES) {
    const { initCounterOffer, updateSelectedBook } = useCounterOffer();
    
    const [selectedBookId, setSelectedBookId] = useState(null);
    const [fetchingBookId, setFetchingBookId] = useState(null);

    // Auto-skip to location step when there's only one offered book
    useEffect(() => {
        if (offeredBooks.length === 1) {
            const singleBook = offeredBooks[0];
            
            // Seed context and skip step 1
            initCounterOffer(routeParams);
            updateSelectedBook(singleBook.id, singleBook.image || null);
            
            // Navigate cleanly without a parameter blob
            navigation.replace(ROUTES.SELECT_SWAP_LOCATION);
        }
    }, [offeredBooks, navigation, routeParams, ROUTES, initCounterOffer, updateSelectedBook]);

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

        // Commit everything to context before moving forward
        initCounterOffer(routeParams);
        updateSelectedBook(selectedBookId, selectedBook?.image || null);
        
        // Navigate cleanly without a parameter blob
        navigation.navigate(ROUTES.SELECT_SWAP_LOCATION);
    };

    return {
        selectedBookId,
        setSelectedBookId,
        fetchingBookId,
        handleBookPress,
        handleNext,
    };
}
