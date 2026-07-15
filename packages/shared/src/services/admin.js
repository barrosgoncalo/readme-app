import { getFunctions, httpsCallable } from 'firebase/functions';

export const alterUserPrivileges = async (targetUid, makeAdmin) => {
    try {
        const functions = getFunctions(undefined, 'europe-west1'); 
        
        const setAdminStatus = httpsCallable(functions, 'setAdminStatus');
        const result = await setAdminStatus({ targetUid, makeAdmin });
        
        return result.data; 
    } catch (error) {
        console.error("[Admin Service] Failed to alter privileges:", error);
        throw error; 
    }
};
