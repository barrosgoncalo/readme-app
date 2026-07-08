// @readme/shared/src/services/DB.js
import { db } from './firebase';
import { 
    collection, doc, getDoc, addDoc, setDoc, 
    updateDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';

export const DB = {
    /**
     * Fetch a single document by ID
     */
    get: async (collectionName, id) => {
        try {
            const snap = await getDoc(doc(db, collectionName, id));
            return snap.exists() ? { id: snap.id, ...snap.data() } : null;
        } catch (error) {
            console.error(`DB.get Error (${collectionName}/${id}):`, error);
            throw error;
        }
    },

    /**
     * Create a document (auto-generates ID unless customId is provided)
     */
    create: async (collectionName, payload, customId = null) => {
        try {
            const dataWithTimestamp = { ...payload, createdAt: serverTimestamp() };
            
            if (customId) {
                await setDoc(doc(db, collectionName, customId), dataWithTimestamp);
                return customId;
            } else {
                const docRef = await addDoc(collection(db, collectionName), dataWithTimestamp);
                return docRef.id;
            }
        } catch (error) {
            console.error(`DB.create Error (${collectionName}):`, error);
            throw error;
        }
    },

    /**
     * Update a document (automatically adds updatedAt)
     */
    update: async (collectionName, id, payload) => {
        try {
            const ref = doc(db, collectionName, id);
            await updateDoc(ref, { 
                ...payload, 
                updatedAt: serverTimestamp() 
            });
            return true;
        } catch (error) {
            console.error(`DB.update Error (${collectionName}/${id}):`, error);
            throw error;
        }
    },

    /**
     * Delete a document
     */
    remove: async (collectionName, id) => {
        try {
            await deleteDoc(doc(db, collectionName, id));
            return true;
        } catch (error) {
            console.error(`DB.delete Error (${collectionName}/${id}):`, error);
            throw error;
        }
    }
};
