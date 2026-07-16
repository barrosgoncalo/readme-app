import { db } from './firebase';
import { 
    collection, doc, getDoc, addDoc, setDoc, 
    updateDoc, deleteDoc, serverTimestamp, arrayUnion,
    query, where, orderBy, getDocs, getDocsFromServer, onSnapshot, limit, startAfter, getCountFromServer,
    collectionGroup
} from 'firebase/firestore';

export const DB = {

    /**
     * Fetches a single doc by ID (string) OR multiple docs by conditions (array)
     * @param {string} collectionPath 
     * @param {string|Array} queryArgs - A document ID string OR array of query objects
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
 * Fetches a collection with ordering, optional where-clauses, and optional server-forced read.
 * @param {string} collectionPath
 * @param {{field: string, direction?: 'asc'|'desc'}} orderByArg
 * @param {Array} whereArgs - optional array of {field, operator, value}
 * @param {{source?: 'server'|'cache'|'default'}} options
 */
    getOrderedBy: async (collectionPath, orderByArg, whereArgs = [], options = {}) => {
        try {
            const colRef = collection(db, collectionPath);
            const constraints = whereArgs.map(w => where(w.field, w.operator, w.value));
            constraints.push(orderBy(orderByArg.field, orderByArg.direction || 'asc'));

            const q = query(colRef, ...constraints);
            const fetchFn = options.source === 'server' ? getDocsFromServer : getDocs;
            const snap = await fetchFn(q);

            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (error) {
            console.error(`DB.getOrderedBy Error on path "${collectionPath}":`, error);
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
    update: async (collectionName, docId, data, includeTimestamp = false) => {
        const docRef = doc(db, collectionName, docId);
        const payload = { ...data };

        if (includeTimestamp) {
            payload.updatedAt = serverTimestamp(); 
        }

        return await updateDoc(docRef, payload);
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
     * Matches the split argument pattern of DB.get()
     */
    subscribeDoc: (collectionPath, docId, onUpdate, onError) => {
        const docRef = doc(db, collectionPath, docId);

        return onSnapshot(
            docRef,
            (snapshot) => {
                onUpdate(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
            },
            (error) => {
                if (onError) onError(error);
                
                if (error?.code === 'permission-denied') return;

                if (!onError) {
                    console.error(`DB.subscribeDoc error on "${collectionPath}/${docId}":`, error);
                }
            }
        );
    },

    /**
     * Generic Path Stream: Infers document vs collection from string segments
     * e.g., 'publications' (collection) vs 'publications/1234' (document)
     */
    subscribe: (path, onUpdate, onError) => {
        const pathSegments = path.split('/').filter(Boolean);
        const isDocument = pathSegments.length % 2 === 0;

        const q = isDocument ? doc(db, path) : collection(db, path);

        return onSnapshot(
            q,
            (snapshot) => {
                if (isDocument) {
                    onUpdate(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
                } else {
                    onUpdate(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                }
            },
            (error) => {
                if (onError) onError(error);

                if (error?.code === 'permission-denied') return;

                if (!onError) {
                    console.error(`DB.stream error on "${path}":`, error);
                }
            }
        );
    },

    /**
     * Query Stream: Used when you need to filter a collection.
     */
    subscribeQuery: (collectionName, conditions = [], onUpdate, onError) => {
        let q = collection(db, collectionName);

        if (conditions.length > 0) {
            const constraints = conditions.map(c => where(c.field, c.operator, c.value));
            q = query(q, ...constraints);
        }

        return onSnapshot(
            q,
            (snapshot) => {
                onUpdate(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            },
            (error) => {
                if (onError) onError(error);
                
                if (error?.code === 'permission-denied') return;

                if (!onError) {
                    console.error(`DB.streamQuery error on "${collectionName}":`, error);
                }
            }
        );
    },

    /**
     * Advanced Query Stream: Supports where-clauses, ordering, and limits.
     */
    subscribeAdvanced: (path, conditions = [], orderByArg = null, limitAmount = null, onUpdate, onError) => {
        let q = collection(db, path);

        if (conditions.length > 0) {
            const constraints = conditions.map(c => where(c.field, c.operator, c.value));
            q = query(q, ...constraints);
        }

        if (orderByArg) {
            q = query(q, orderBy(orderByArg.field, orderByArg.direction || 'asc'));
        }

        if (limitAmount) {
            q = query(q, limit(limitAmount));
        }

        return onSnapshot(
            q,
            (snapshot) => {
                onUpdate(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            },
            (error) => {
                if (onError) onError(error);
                
                if (error?.code === 'permission-denied') return;

                if (!onError) {
                    console.error(`DB.subscribeAdvanced error on "${path}":`, error);
                }
            }
        );
    },

    /**
     * Returns the total count of documents in a collection (useful for pagination)
     */
    count: async (collectionPath, conditions = []) => {
        try {
            let q = collection(db, collectionPath);
            if (conditions.length > 0) {
                const constraints = conditions.map(c => where(c.field, c.operator, c.value));
                q = query(q, ...constraints);
            }
            const snap = await getCountFromServer(q);

            return snap.data().count;
        } catch (error) {
            console.error(`DB.count Error on path "${collectionPath}":`, error);
            throw error;
        }
    },

    countCollectionGroup: async (collectionGroupName, whereArgs = []) => {
        try {
            const colRef = collectionGroup(db, collectionGroupName);
            const constraints = whereArgs.map(w => where(w.field, w.operator, w.value));
            const q = constraints.length ? query(colRef, ...constraints) : colRef;
            const snap = await getCountFromServer(q);
            return snap.data().count;
        } catch (error) {
            console.error(`DB.countCollectionGroup Error on group "${collectionGroupName}":`, error);
            throw error;
        }
    },

    /**
     * Fetches a page of documents, supporting cursors (startAfter) and limits.
     * Returns the documents and the last document cursor to use for the next page.
     */
    getPaginated: async (collectionPath, orderByArg, limitAmount, lastVisibleDoc = null, conditions = []) => {
        try {
            const colRef = collection(db, collectionPath);
            const constraints = conditions.map(w => where(w.field, w.operator, w.value));

            constraints.push(orderBy(orderByArg.field, orderByArg.direction || 'asc'));

            if (lastVisibleDoc)
                constraints.push(startAfter(lastVisibleDoc));

            constraints.push(limit(limitAmount));

            const q = query(colRef, ...constraints);
            const snap = await getDocs(q);

            return {
                docs: snap.docs.map(d => ({ id: d.id, ...d.data() })),
                lastVisible: snap.docs[snap.docs.length - 1] || null
            };
        } catch (error) {
            console.error(`DB.getPaginated Error on path "${collectionPath}":`, error);
            throw error;
        }
    },

    arrayUnion: (value) => arrayUnion(value),
}
