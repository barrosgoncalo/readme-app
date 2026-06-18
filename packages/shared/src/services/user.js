import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase"; // Confirma que importas o db aqui!

export const uploadProfilePicture = async (userId, imageUri) => {
    try {
        console.log("A preparar a imagem para upload...", imageUri);

        // 1. Conversão à prova de bala (XHR)
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

        // 2. Referência no Storage e Upload
        const storageRef = ref(storage, `profile_pictures/${userId}`);
        await uploadBytes(storageRef, blob);

        // 3. Obter o URL final
        const downloadUrl = await getDownloadURL(storageRef);
        console.log("Upload concluído! URL:", downloadUrl);
        
        // 4. ATUALIZAR O FIRESTORE (Isto é o que estava a faltar!)
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, {
            photoURL: downloadUrl
        });
        
        return downloadUrl;
        
    } catch (error) {
        console.error("Erro fatal no uploadProfilePicture:", error);
        throw error;
    }
};
