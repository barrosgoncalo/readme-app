import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Fetches all books belonging to a specific user UID
 */
export const fetchBooksByUserId = async (userId) => {
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
