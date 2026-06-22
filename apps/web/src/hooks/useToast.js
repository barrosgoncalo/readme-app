import { useState, useCallback, useRef } from 'react';

export function useToast(duration = 3500) {
    const [toast, setToast] = useState('');
    const timerRef = useRef(null);
    const showToast = useCallback((message) => {
        clearTimeout(timerRef.current);
        setToast(message);
        timerRef.current = setTimeout(() => setToast(''), duration);
    }, [duration]);
    return [toast, showToast];
}
