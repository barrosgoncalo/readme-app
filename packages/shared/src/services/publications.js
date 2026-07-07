import { collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Fetches all books belonging to a specific user UID
 */
export const fetchUserPublications = async (userId) => {
    const q = query(
        collection(db, 'publications'),
        where('uid', '==', userId)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

/**
 * All publications, newest first (Explore feed). Simple client sort — fine at project scale.
 */
export const fetchAllPublications = async () => {
    const snap = await getDocs(collection(db, 'publications'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * Fetch a single publication by ID
 */
export const fetchPublicationById = async (id) => {
    const s = await getDoc(doc(db, 'publications', id));
    return s.exists() ? { id: s.id, ...s.data() } : null;
};

/**
 * Create a new publication with a custom ID (reused for Storage folder).
 */
export const createPublication = async (customId, data) => {
    await setDoc(doc(db, 'publications', customId), data);
    return customId;
};

/**
 * Delete a publication by ID
 */
export const deletePublication = async (id) => deleteDoc(doc(db, 'publications', id));
