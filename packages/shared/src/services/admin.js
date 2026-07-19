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

export const banUserAccount = async (targetUid, reason) => {
    try {
        const functions = getFunctions(undefined, 'europe-west1');
        const banUserFn = httpsCallable(functions, 'banUser');
        const result = await banUserFn({ userId: targetUid, reason });

        return result.data;
    } catch (error) {
        console.error("[Admin Service] Failed to ban user:", error);
        throw error;
    }
};
