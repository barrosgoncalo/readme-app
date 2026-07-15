import React, { createContext, useContext, useState, useCallback } from 'react';

const OfferContext = createContext();

export function OfferProvider({ children }) {
    const [offerDraft, setOfferDraft] = useState({
        targetBook: null,
        targetSeller: null,
        offeredBooks: [],
    });

    const startOffer = useCallback((targetBook, targetSeller) => {
        setOfferDraft({
            targetBook,
            targetSeller,
            offeredBooks: [], 
        });
    }, []);

    const updateOfferedBooks = useCallback((offeredBooks) => {
        setOfferDraft((prev) => ({ ...prev, offeredBooks }));
    }, []);

    const clearOffer = useCallback(() => {
        setOfferDraft({ targetBook: null, targetSeller: null, offeredBooks: [] });
    }, []);

    return (
        <OfferContext.Provider value={{ offerDraft, startOffer, updateOfferedBooks, clearOffer }}>
            {children}
        </OfferContext.Provider>
    );
}

export const useOffer = () => useContext(OfferContext);
