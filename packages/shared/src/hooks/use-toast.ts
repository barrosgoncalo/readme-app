import { useState, useCallback } from 'react';

export function useToast(defaultDuration = 3000) {
    const [toast, setToast] = useState('');

    const showToast = useCallback((message, duration = defaultDuration) => {
        setToast(message);

        setTimeout(() => {
            setToast('');
        }, duration);
    }, [defaultDuration]);

    return [toast, showToast];
}