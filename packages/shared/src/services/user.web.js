import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase.web';

export const uploadProfilePicture = async (uid, file) => {
    const storageRef = ref(storage, `profile_pictures/${uid}`);
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);
    await updateDoc(doc(db, 'users', uid), { photoURL: downloadUrl });
    return downloadUrl;
};
