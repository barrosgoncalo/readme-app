import { storage } from './firebase.web';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Web already hands us File/Blob objects directly (from <input type="file">),
// unlike mobile which passes file:// URIs that need an XHR round-trip to
// become a blob — so this skips storage.js's fetch-as-blob step entirely.
export const StorageService = {
    uploadImage: async (file, path) => {
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    },

    uploadImages: async (files, pathPrefix) => {
        return Promise.all(
            files.map((file, index) => StorageService.uploadImage(file, `${pathPrefix}/image_${index}`))
        );
    },
};
