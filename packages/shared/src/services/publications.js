import { DB } from './DB';

/**
 * Fetches all books belonging to a specific user UID
 */
export const fetchUserPublications = async (userId) => {
    return await DB.get('publications', [
        { field: 'uid', operator: '==', value: userId }
    ]);
};
