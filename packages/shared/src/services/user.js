// @readme/shared/src/services/userService.js
import { doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "./firebase";

const storage = getStorage();

export const uploadProfilePicture = async (uid, imageUri) => {
    try {
        const response = await fetch(imageUri);
        const blob = await response.blob();

        const storageRef = ref(storage, `profile_pictures/${uid}`);

        await uploadBytes(storageRef, blob);

        const downloadUrl = await getDownloadURL(storageRef);

        const userDocRef = doc(db, "users", uid);
        await updateDoc(userDocRef, {
            photoURL: downloadUrl
        });

        return downloadUrl;
    } catch (error) {
        console.error("Erro no upload da foto: ", error);
        throw error;
    }
};
