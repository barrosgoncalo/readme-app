import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

// Accepts either:
//   - a string URI  → mobile (e.g. expo-image-picker output). Fetched via XHR
//     into a Blob before upload, because RN's fetch().blob() is unreliable.
//   - a File / Blob → web (file input). Uploaded directly.
// Writes the resulting download URL back to users/{uid}.photoURL.
export const uploadProfilePicture = async (uid, fileOrUri) => {
    let blob = fileOrUri;
    if (typeof fileOrUri === 'string') {
        blob = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = () => resolve(xhr.response);
            xhr.onerror = () => reject(new TypeError('Network conversion failed'));
            xhr.responseType = 'blob';
            xhr.open('GET', fileOrUri, true);
            xhr.send(null);
        });
    }

    const storageRef = ref(storage, `profile_pictures/${uid}`);
    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);
    await updateDoc(doc(db, 'users', uid), { photoURL: downloadUrl });
    return downloadUrl;
};
