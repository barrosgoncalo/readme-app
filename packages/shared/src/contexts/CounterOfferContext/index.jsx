import React, { createContext, useContext, useState, useCallback } from 'react';

const CounterOfferContext = createContext();

export function CounterOfferProvider({ children }) {
    const [counterDraft, setCounterDraft] = useState({
        chatId: null,
        messageId: null,
        offerDetails: null,
        targetSellerUid: null,
        selectedBookId: null,
        selectedBookImage: null
    });

    // Seeds the root chat/offer data from the entry point
    const initCounterOffer = useCallback((initialData) => {
        setCounterDraft(prev => ({ ...prev, ...initialData }));
    }, []);

    // Updates just the book selection during Step 1
    const updateSelectedBook = useCallback((id, image) => {
        setCounterDraft(prev => ({ ...prev, selectedBookId: id, selectedBookImage: image }));
    }, []);

    // Wipes the slate clean after completion or exit
    const clearCounterOffer = useCallback(() => {
        setCounterDraft({
            chatId: null, messageId: null, offerDetails: null,
            targetSellerUid: null, selectedBookId: null, selectedBookImage: null
        });
    }, []);

    return (
        <CounterOfferContext.Provider value={{ 
            counterDraft, 
            initCounterOffer, 
            updateSelectedBook, 
            clearCounterOffer 
        }}>
            {children}
        </CounterOfferContext.Provider>
    );
}

export const useCounterOffer = () => useContext(CounterOfferContext);
