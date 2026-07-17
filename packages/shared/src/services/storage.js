import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const StorageService = {
    /**
     * Accepts either a File/Blob (web file inputs) or a URI string
     * (mobile's file:// URIs from expo-image-picker). URIs are fetched
     * into a blob first; File/Blob objects are uploaded as-is.
     */
    uploadImage: async (uriOrFile, path) => {
        let blob = uriOrFile;

        if (typeof uriOrFile === 'string') {
            blob = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.onload = () => resolve(xhr.response);
                xhr.onerror = () => reject(new TypeError('Network request failed'));
                xhr.responseType = 'blob';
                xhr.open('GET', uriOrFile, true);
                xhr.send(null);
            });
        }

        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, blob);
        if (typeof uriOrFile === 'string' && blob.close) blob.close();

        return await getDownloadURL(storageRef);
    },

    uploadImages: async (uris, pathPrefix) => {
        return Promise.all(
            uris.map((uri, index) => StorageService.uploadImage(uri, `${pathPrefix}/image_${index}`))
        );
    },
};
