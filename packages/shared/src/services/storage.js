import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const StorageService = {
    uploadImage: async (uri, path) => {
        const blob = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = () => resolve(xhr.response);
            xhr.onerror = () => reject(new TypeError('Network request failed'));
            xhr.responseType = 'blob';
            xhr.open('GET', uri, true);
            xhr.send(null);
        });

        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, blob);
        if (blob.close) blob.close();

        return await getDownloadURL(storageRef);
    },

    uploadImages: async (uris, pathPrefix) => {
        return Promise.all(
            uris.map((uri, index) => StorageService.uploadImage(uri, `${pathPrefix}/image_${index}`))
        );
    },
};
