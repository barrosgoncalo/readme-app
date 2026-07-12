// services/cloudFunctions.js
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export const CloudFunctions = {
    call: async (functionName, payload = {}) => {
        try {
            const fn = httpsCallable(functions, functionName);
            const result = await fn(payload);
            return result.data;
        } catch (error) {
            console.error(`Error calling Cloud Function "${functionName}":`, error);
            throw error;
        }
    },
};
