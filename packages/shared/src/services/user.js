// @readme/shared/src/services/userService.js
import { doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "./firebase";

const storage = getStorage();

export const uploadProfilePicture = async (uid, imageUri) => {
    try {
        // Converter o URI da imagem num "Blob" (formato binário que o Firebase entende)
        const response = await fetch(imageUri);
        const blob = await response.blob();

        // Dizer ao Storage ONDE guardar a foto (pasta profile_pictures / uid_do_user)
        const storageRef = ref(storage, `profile_pictures/${uid}`);

        // Fazer o Upload!
        await uploadBytes(storageRef, blob);

        // Pedir ao Storage o URL público da foto que acabámos de enviar
        const downloadUrl = await getDownloadURL(storageRef);

        // Guardar esse URL no documento do utilizador no Firestore
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
