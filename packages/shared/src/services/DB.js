// @readme/shared/src/services/DB.js
import { db } from './firebase';
import { 
    collection, doc, getDoc, addDoc, setDoc, 
    updateDoc, deleteDoc, serverTimestamp,
    query, where, getDocs, onSnapshot, orderBy
} from 'firebase/firestore';

export const DB = {
    /**
     * Fetches a single doc by ID (string) OR multiple docs by conditions (array)
     * @param {string} collectionName 
     * @param {string|Array} idOrConditions - A document ID string OR array of query objects
     */
    get: async (collectionPath, queryArgs) => {
        try {
            // Fetching a single document by ID (String)
            if (typeof queryArgs === 'string') {
                const snap = await getDoc(doc(db, collectionPath, queryArgs));
                return snap.exists() ? { id: snap.id, ...snap.data() } : null;
            }

            // Fetching via Query (Array)
            if (Array.isArray(queryArgs)) {
                const heavyQuery = queryArgs.find(q => 
                    ['in', 'not-in', 'array-contains-any'].includes(q.operator) && 
                        Array.isArray(q.value) && 
                        q.value.length > 10
                );

                if (heavyQuery) {
                    // Chunk the massive array into pieces of 10
                    const chunks = [];
                    for (let i = 0; i < heavyQuery.value.length; i += 10) {
                        chunks.push(heavyQuery.value.slice(i, i + 10));
                    }

                    // Recursively call DB.get for each chunk safely
                    const chunkPromises = chunks.map(chunk => {
                        const safeQueryArgs = queryArgs.map(q => 
                            q === heavyQuery ? { ...q, value: chunk } : q
                        );
                        return DB.get(collectionPath, safeQueryArgs);
                    });

                    // Resolve all chunks in parallel and flatten into a single array
                    const resolvedChunks = await Promise.all(chunkPromises);
                    return resolvedChunks.flat();
                }

                // --- Standard Query Execution (Safe <= 10 items or standard operators) ---
                const colRef = collection(db, collectionPath);

                if (queryArgs.length === 0) {
                    // Fetch whole collection
                    const snap = await getDocs(colRef);
                    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
                }

                // Map standard where clauses
                const constraints = queryArgs.map(q => where(q.field, q.operator, q.value));
                const q = query(colRef, ...constraints);
                const snap = await getDocs(q);
                return snap.docs.map(d => ({ id: d.id, ...d.data() }));
            }
        } catch (error) {
            console.error(`DB.get Error on path "${collectionPath}":`, error);
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
    },

    /**
     * Real-time stream subscription for a collection or subcollection
     * @param {string} collectionName - Path to the collection
     * @param {function} onUpdate - Callback when data changes
     * @param {function} onError - Optional error callback
     * @param {string} orderByField - Field to sort by (defaults to 'createdAt')
     * @param {string} direction - Sort direction (defaults to 'desc')
     * @returns {function} Unsubscribe function
     */
    stream: (collectionName, onUpdate, onError, orderByField = 'createdAt', direction = 'desc') => {
        try {
            const colRef = collection(db, collectionName);
            const q = query(colRef, orderBy(orderByField, direction));

            // Returns the unsubscribe function natively
            return onSnapshot(q, (snapshot) => {
                const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                onUpdate(list);
            }, onError);
        } catch (error) {
            console.error(`DB.stream Error on collection "${collectionName}":`, error);
            if (onError) onError(error);
        }
    }
};
