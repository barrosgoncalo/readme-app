import { db, storage } from "./firebase";
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
    increment
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const USERS_COLLECTION = 'users';

/**
 * Fetches a single user's profile data by their UID.
 */
export const fetchUserProfile = async (uid) => {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
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
