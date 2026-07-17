// Web stub for react-native-image-colors. The real module is RN-native and
// never used on web — books.js falls back to a default color when getColors
// rejects. Keeping the stub here lets the shared books service stay platform-free.
export default {
    getColors: () => Promise.reject(new Error('react-native-image-colors is not available on web')),
};
