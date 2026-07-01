import { auth, db, storage } from "./firebase";
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    query, 
    where, 
    documentId,
    arrayUnion,
    arrayRemove,
    increment,
    writeBatch,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFollowId, createFollow } from '../models/follow';

const USERS_COLLECTION = 'users';

/**
 * Fetches a user's profile and checks if the current user is following them.
 * @param {string} userId - The ID of the profile being viewed
 */
export const fetchUserProfile = async (userId) => {
    if (!userId) throw new Error("User ID is required to fetch profile.");

    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return null;
        }

        const userData = userSnap.data();
        let isCurrentUserFollowing = false;
        
        const currentUserId = auth?.currentUser?.uid;
        
        if (currentUserId && currentUserId !== userId) {
            const followDocId = getFollowId(currentUserId, userId);
            const followRef = doc(db, 'follows', followDocId);
            const followSnap = await getDoc(followRef);
            
            isCurrentUserFollowing = followSnap.exists();
        }

        return {
            id: userSnap.id,
            ...userData,
            followers: userData.followersCount || 0,
            following: userData.followingCount || 0,
            isCurrentUserFollowing: isCurrentUserFollowing
        };

    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
    }
};

/**
 * Fetches multiple users by an array of UIDs, handling Firestore's 10-item 'in' query limit.
 * Returns a dictionary mapped by UID.
 */
export async function getUsersByIds(uids) {
    if (!uids || uids.length === 0) return {};

    // Firestore 'in' queries are limited to 10 items, so we chunk the array
    const chunks = [];
    for (let i = 0; i < uids.length; i += 10) {
        chunks.push(uids.slice(i, i + 10));
    }

    const results = await Promise.all(
        chunks.map(async (chunk) => {
            const q = query(
                collection(db, USERS_COLLECTION),
                where(documentId(), 'in', chunk),
            );
            const snapshot = await getDocs(q);
            const map = {};
            snapshot.docs.forEach((d) => {
                map[d.id] = {
                    username: d.data().username,
                    fullName: d.data().fullName,
                };
            });
            return map;
        })
    );

    return results.reduce((acc, map) => ({ ...acc, ...map }), {});
}

/**
 * Executes a dual-document batch update to toggle favorite statuses.
 */
export const toggleFavoriteStatus = async (userId, bookId, isCurrentlyFavorited) => {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    const publicationDocRef = doc(db, 'publications', bookId); 

    await Promise.all([
        updateDoc(userDocRef, { 
            favoriteBooks: !isCurrentlyFavorited ? arrayUnion(bookId) : arrayRemove(bookId) 
        }),
        updateDoc(publicationDocRef, { 
            "stats.likesCount": increment(!isCurrentlyFavorited ? 1 : -1) 
        })
    ]);
};

/**
 * Uploads a profile picture to Firebase Storage and updates the user's Firestore document.
 */
export const uploadProfilePicture = async (userId, imageUri) => {
    try {
        console.log("A preparar a imagem para upload...", imageUri);

        // 1. Bulletproof XHR Conversion to Blob
        const blob = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function() {
                resolve(xhr.response);
            };
            xhr.onerror = function(e) {
                console.error("Erro na conversão XHR:", e);
                reject(new TypeError('A conversão de rede falhou'));
            };
            xhr.responseType = 'blob';
            xhr.open('GET', imageUri, true);
            xhr.send(null);
        });

        console.log("Blob criado com sucesso! Tamanho:", blob.size);

        // 2. Storage Reference and Upload
        const storageRef = ref(storage, `profile_pictures/${userId}`);
        await uploadBytes(storageRef, blob);

        // 3. Get the final download URL
        const downloadUrl = await getDownloadURL(storageRef);
        console.log("Upload concluído! URL:", downloadUrl);

        // 4. Update Firestore with the new image URL
        const userDocRef = doc(db, USERS_COLLECTION, userId);
        await updateDoc(userDocRef, {
            photoURL: downloadUrl
        });

        return downloadUrl;

    } catch (error) {
        console.error("Erro fatal no uploadProfilePicture:", error);
        throw error;
    }
};

/**
 * Toggles the follow status between the current logged-in user and a target user.
 * @param {string} targetUserId - The ID of the profile being followed (passed from UI)
 * @param {boolean} shouldFollow - True to follow, False to unfollow (passed from UI)
 */
export const toggleFollowUser = async (targetUserId, shouldFollow) => {
    const currentUserId = auth?.currentUser?.uid; 

    // Guard rails to make sure nothing is undefined or a boolean
    if (!currentUserId) throw new Error("Authentication required to follow users.");
    if (!targetUserId || typeof targetUserId !== 'string') throw new Error("Valid Target User ID string required.");

    const batch = writeBatch(db);
    
    // Use the model to generate the composite ID string cleanly
    const followDocId = getFollowId(currentUserId, targetUserId);
    const followRef = doc(db, 'follows', followDocId);

    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    if (shouldFollow) {
        // Create the follow link using the model dictionary template
        batch.set(followRef, createFollow(currentUserId, targetUserId));

        // Increment counts (make sure these field names match your Firestore fields exactly)
        batch.update(currentUserRef, { followingCount: increment(1) });
        batch.update(targetUserRef, { followersCount: increment(1) });
    } else {
        // Delete the follow link
        batch.delete(followRef);

        // Decrement counts
        batch.update(currentUserRef, { followingCount: increment(-1) });
        batch.update(targetUserRef, { followersCount: increment(-1) });
    }

    await batch.commit();
};
